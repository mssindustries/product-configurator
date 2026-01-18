/**
 * Configurator page for customizing and generating 3D product models.
 *
 * States:
 * - loading: Fetching product details from API
 * - configuring: Product loaded, user adjusting controls, no GLB yet
 * - generating: Job in progress with progress bar
 * - viewing: GLB loaded in 3D viewer
 * - error: Error occurred during any operation
 */

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Scene3D, ModelViewer } from '../components/scene';
import { ControlPanel, type ConfigSchema, type ConfigValues } from '../components/controls';
import {
  getProduct,
  saveConfiguration,
  createJob,
  pollJobStatus,
  ApiClientError,
} from '../services/api';
import type { Product, JobStatusResponse } from '../types/api';

/** Page state machine */
type PageState = 'loading' | 'configuring' | 'generating' | 'viewing' | 'error';

/** Placeholder 3D component shown when no model is loaded */
function PlaceholderModel() {
  return (
    <mesh>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#cccccc" wireframe />
    </mesh>
  );
}

export default function ConfiguratorPage() {
  const { productId } = useParams<{ productId: string }>();

  // State
  const [pageState, setPageState] = useState<PageState>('loading');
  const [product, setProduct] = useState<Product | null>(null);
  const [configValues, setConfigValues] = useState<ConfigValues>({});
  const [glbUrl, setGlbUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [savedConfigId, setSavedConfigId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  /**
   * Load product details on mount.
   */
  useEffect(() => {
    async function loadProduct() {
      if (!productId) {
        setError('No product ID provided');
        setPageState('error');
        return;
      }

      try {
        setPageState('loading');
        setError(null);

        const fetchedProduct = await getProduct(productId);
        setProduct(fetchedProduct);

        // Initialize config values from schema defaults
        const schema = fetchedProduct.config_schema as unknown as ConfigSchema;
        const initialValues: ConfigValues = {};

        if (schema?.properties) {
          for (const [key, property] of Object.entries(schema.properties)) {
            if (property.default !== undefined) {
              initialValues[key] = property.default;
            } else if (property.enum && property.enum.length > 0) {
              initialValues[key] = property.enum[0];
            } else if (property.minimum !== undefined) {
              initialValues[key] = property.minimum;
            }
          }
        }

        setConfigValues(initialValues);
        setPageState('configuring');
      } catch (err) {
        const message =
          err instanceof ApiClientError
            ? err.detail || err.message
            : 'Failed to load product';
        setError(message);
        setPageState('error');
      }
    }

    loadProduct();
  }, [productId]);

  /**
   * Handle configuration value changes.
   */
  const handleConfigChange = useCallback((newValues: ConfigValues) => {
    setConfigValues(newValues);
    // Reset save success indicator when values change
    setSaveSuccess(false);
  }, []);

  /**
   * Save configuration to the API.
   */
  const handleSaveConfiguration = useCallback(async () => {
    if (!product || !productId) return;

    try {
      setIsSaving(true);
      setSaveSuccess(false);
      setError(null);

      const savedConfig = await saveConfiguration({
        product_id: productId,
        client_id: product.client_id,
        name: `${product.name} Configuration`,
        config_data: configValues as Record<string, unknown>,
      });

      setSavedConfigId(savedConfig.id);
      setSaveSuccess(true);

      // Clear success message after 3 seconds
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.detail || err.message
          : 'Failed to save configuration';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  }, [product, productId, configValues]);

  /**
   * Generate 3D model by creating a job and polling for completion.
   */
  const handleGenerate = useCallback(async () => {
    if (!product || !productId) return;

    try {
      setPageState('generating');
      setProgress(0);
      setError(null);
      setGlbUrl(null);

      // First, save the configuration if not already saved
      let configId = savedConfigId;
      if (!configId) {
        const savedConfig = await saveConfiguration({
          product_id: productId,
          client_id: product.client_id,
          name: `${product.name} Configuration`,
          config_data: configValues as Record<string, unknown>,
        });
        configId = savedConfig.id;
        setSavedConfigId(configId);
      }

      // Create a job for the configuration
      const job = await createJob({ configuration_id: configId });

      // Poll for job completion
      const finalStatus = await pollJobStatus(job.id, {
        interval: 1000,
        timeout: 300000, // 5 minutes
        onProgress: (status: JobStatusResponse) => {
          setProgress(status.progress);
        },
      });

      if (finalStatus.status === 'COMPLETED' && finalStatus.result_url) {
        setGlbUrl(finalStatus.result_url);
        setPageState('viewing');
      } else if (finalStatus.status === 'FAILED') {
        setError(finalStatus.error_message || 'Job failed');
        setPageState('error');
      } else if (finalStatus.status === 'CANCELLED') {
        setError('Job was cancelled');
        setPageState('configuring');
      }
    } catch (err) {
      const message =
        err instanceof ApiClientError
          ? err.detail || err.message
          : 'Failed to generate model';
      setError(message);
      setPageState('error');
    }
  }, [product, productId, configValues, savedConfigId]);

  /**
   * Reset error state and return to configuring.
   */
  const handleRetry = useCallback(() => {
    setError(null);
    setPageState(product ? 'configuring' : 'loading');
  }, [product]);

  // Render loading state
  if (pageState === 'loading') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (pageState === 'error') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-6 h-6 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={handleRetry}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const configSchema = product?.config_schema as ConfigSchema | undefined;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {product?.name || 'Product Configurator'}
          </h1>
          {product?.description && (
            <p className="text-gray-600 mt-1">{product.description}</p>
          )}
        </div>
      </header>

      {/* Main content - two column layout */}
      <div className="flex h-[calc(100vh-80px)]">
        {/* Left sidebar - Control Panel */}
        <aside className="w-80 bg-white shadow-lg overflow-y-auto flex flex-col">
          <div className="flex-1 p-4">
            {configSchema && (
              <ControlPanel
                config_schema={configSchema}
                values={configValues}
                onChange={handleConfigChange}
                title="Configuration"
              />
            )}
          </div>

          {/* Action buttons */}
          <div className="p-4 border-t border-gray-200 space-y-3">
            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={pageState === 'generating'}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                pageState === 'generating'
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {pageState === 'generating' ? 'Generating...' : 'Generate 3D Model'}
            </button>

            {/* Progress bar during generation */}
            {pageState === 'generating' && (
              <div className="space-y-2">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 text-center">{progress}% complete</p>
              </div>
            )}

            {/* Save configuration button */}
            <button
              onClick={handleSaveConfiguration}
              disabled={isSaving || pageState === 'generating'}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                isSaving || pageState === 'generating'
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
              }`}
            >
              {isSaving ? 'Saving...' : 'Save Configuration'}
            </button>

            {/* Save success message */}
            {saveSuccess && (
              <div className="flex items-center justify-center text-green-600 text-sm">
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Configuration saved!
              </div>
            )}

            {/* Inline error message */}
            {error && (
              <div className="text-red-600 text-sm text-center">{error}</div>
            )}
          </div>
        </aside>

        {/* Main area - 3D Viewer */}
        <main className="flex-1 relative">
          <Scene3D backgroundColor="#e5e7eb">
            {glbUrl ? (
              <ModelViewer
                url={glbUrl}
                onError={(err) => {
                  console.error('Model load error:', err);
                  setError('Failed to load 3D model');
                }}
              />
            ) : (
              <PlaceholderModel />
            )}
          </Scene3D>

          {/* Overlay for generating state */}
          {pageState === 'generating' && (
            <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
              <div className="bg-white p-6 rounded-lg shadow-lg text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-700 font-medium">Generating your 3D model...</p>
                <p className="text-gray-500 text-sm mt-1">{progress}% complete</p>
              </div>
            </div>
          )}

          {/* Viewing state indicator */}
          {pageState === 'viewing' && (
            <div className="absolute top-4 right-4 bg-green-100 text-green-800 px-4 py-2 rounded-lg shadow-sm">
              <span className="flex items-center">
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Model loaded
              </span>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
