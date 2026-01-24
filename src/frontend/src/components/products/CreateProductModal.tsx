import { useState, useEffect, useCallback } from 'react';
import { getClients, createProduct, ApiClientError } from '../../services/api';
import type { Client } from '../../types/api';
import { Button, Input, Modal, Alert, Select, Textarea } from '../ui';

/**
 * Form data for creating a product.
 */
interface ProductFormData {
  clientId: string;
  name: string;
  description: string;
  templateBlobPath: string;
  configSchema: string;
}

/**
 * Form validation errors.
 */
interface FormErrors {
  clientId?: string;
  name?: string;
  templateBlobPath?: string;
  configSchema?: string;
}

/**
 * Initial form state.
 */
const initialFormData: ProductFormData = {
  clientId: '',
  name: '',
  description: '',
  templateBlobPath: '',
  configSchema: '',
};

/**
 * Validates JSON syntax and returns error message if invalid.
 */
function validateJsonSyntax(value: string): string | undefined {
  if (!value.trim()) {
    return undefined; // Empty is not a JSON syntax error (required validation handles it)
  }
  try {
    JSON.parse(value);
    return undefined;
  } catch (err) {
    return `Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

/**
 * Props for CreateProductModal.
 */
export interface CreateProductModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when product is successfully created */
  onSuccess: () => void;
}

/**
 * Modal for creating a new product.
 *
 * @example
 * <CreateProductModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSuccess={() => refetchProducts()}
 * />
 */
export function CreateProductModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateProductModalProps) {
  // Form state
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client dropdown state
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);

  /**
   * Fetch clients when modal opens.
   */
  const fetchClients = useCallback(async () => {
    setIsLoadingClients(true);
    setClientsError(null);

    try {
      const response = await getClients();
      setClients(response.items);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setClientsError(err.detail || err.message);
      } else if (err instanceof Error) {
        setClientsError(err.message);
      } else {
        setClientsError('Failed to load clients');
      }
    } finally {
      setIsLoadingClients(false);
    }
  }, []);

  /**
   * Reset form when modal opens/closes.
   */
  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setErrors({});
      setSubmitError(null);
      fetchClients();
    }
  }, [isOpen, fetchClients]);

  /**
   * Update a form field.
   */
  const updateField = (field: keyof ProductFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Handle config schema blur to validate JSON syntax.
   */
  const handleConfigSchemaBlur = () => {
    const jsonError = validateJsonSyntax(formData.configSchema);
    if (jsonError) {
      setErrors((prev) => ({ ...prev, configSchema: jsonError }));
    }
  };

  /**
   * Validate form and return true if valid.
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.clientId) {
      newErrors.clientId = 'Client is required';
    }

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Product name must be 255 characters or less';
    }

    if (!formData.templateBlobPath.trim()) {
      newErrors.templateBlobPath = 'Template path is required';
    } else if (formData.templateBlobPath.length > 500) {
      newErrors.templateBlobPath = 'Template path must be 500 characters or less';
    }

    if (!formData.configSchema.trim()) {
      newErrors.configSchema = 'Configuration schema is required';
    } else {
      const jsonError = validateJsonSyntax(formData.configSchema);
      if (jsonError) {
        newErrors.configSchema = jsonError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse config schema JSON
      const configSchemaObj = JSON.parse(formData.configSchema);

      await createProduct({
        client_id: formData.clientId,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        template_blob_path: formData.templateBlobPath.trim(),
        config_schema: configSchemaObj,
      });

      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setSubmitError(err.detail || err.message);
      } else if (err instanceof Error) {
        setSubmitError('Failed to create product. Please try again.');
      } else {
        setSubmitError('An unexpected error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle modal close.
   */
  const handleClose = () => {
    if (!isSubmitting) {
      onClose();
    }
  };

  // Convert clients to select options
  const clientOptions = clients.map((client) => ({
    value: client.id,
    label: client.name,
  }));

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-lg">
      <form onSubmit={handleSubmit}>
        <Modal.Header>
          <h2 className="text-xl font-semibold text-neutral-900">
            Create New Product
          </h2>
        </Modal.Header>

        <Modal.Body className="space-y-4">
          {/* Client Loading State */}
          {isLoadingClients && (
            <div className="flex items-center gap-2 text-neutral-500 py-2">
              <svg
                className="h-5 w-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Loading clients...</span>
            </div>
          )}

          {/* Client Error State */}
          {!isLoadingClients && clientsError && (
            <Alert intent="danger">
              <p className="text-sm">Failed to load clients: {clientsError}</p>
            </Alert>
          )}

          {/* No Clients Warning */}
          {!isLoadingClients && !clientsError && clients.length === 0 && (
            <Alert intent="warning">
              <p className="text-sm">
                No clients available. Please create a client first.
              </p>
            </Alert>
          )}

          {/* Form Fields - Only show when clients loaded successfully */}
          {!isLoadingClients && !clientsError && clients.length > 0 && (
            <>
              {/* Client Dropdown */}
              <div>
                <label
                  htmlFor="product-client"
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  Client <span className="text-danger-500">*</span>
                </label>
                <Select
                  id="product-client"
                  value={formData.clientId}
                  onChange={(e) => updateField('clientId', e.target.value)}
                  placeholder="Select a client"
                  options={clientOptions}
                  error={!!errors.clientId}
                  disabled={isSubmitting}
                />
                {errors.clientId && (
                  <p className="mt-1 text-sm text-danger-500">{errors.clientId}</p>
                )}
              </div>

              {/* Product Name */}
              <div>
                <label
                  htmlFor="product-name"
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  Product Name <span className="text-danger-500">*</span>
                </label>
                <Input
                  id="product-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Enter product name"
                  error={!!errors.name}
                  disabled={isSubmitting}
                  maxLength={255}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-danger-500">{errors.name}</p>
                )}
              </div>

              {/* Description (Optional) */}
              <div>
                <label
                  htmlFor="product-description"
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  Description
                </label>
                <Textarea
                  id="product-description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Enter product description (optional)"
                  disabled={isSubmitting}
                  rows={3}
                  maxLength={5000}
                />
              </div>

              {/* Template Blob Path (temporary text input) */}
              <div>
                <label
                  htmlFor="product-template-path"
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  Template Path <span className="text-danger-500">*</span>
                </label>
                <Input
                  id="product-template-path"
                  type="text"
                  value={formData.templateBlobPath}
                  onChange={(e) => updateField('templateBlobPath', e.target.value)}
                  placeholder="e.g., templates/product.blend"
                  error={!!errors.templateBlobPath}
                  disabled={isSubmitting}
                  maxLength={500}
                />
                {errors.templateBlobPath && (
                  <p className="mt-1 text-sm text-danger-500">
                    {errors.templateBlobPath}
                  </p>
                )}
                <p className="mt-1 text-xs text-neutral-500">
                  Path to the Blender template file (file upload coming soon)
                </p>
              </div>

              {/* Config Schema (JSON) */}
              <div>
                <label
                  htmlFor="product-config-schema"
                  className="block text-sm font-medium text-neutral-700 mb-1"
                >
                  Configuration Schema (JSON) <span className="text-danger-500">*</span>
                </label>
                <Textarea
                  id="product-config-schema"
                  value={formData.configSchema}
                  onChange={(e) => updateField('configSchema', e.target.value)}
                  onBlur={handleConfigSchemaBlur}
                  placeholder='{"type": "object", "properties": {...}}'
                  error={!!errors.configSchema}
                  disabled={isSubmitting}
                  rows={6}
                  className="font-mono text-sm"
                />
                {errors.configSchema && (
                  <p className="mt-1 text-sm text-danger-500">{errors.configSchema}</p>
                )}
              </div>
            </>
          )}

          {/* Submit Error */}
          {submitError && (
            <Alert intent="danger">
              <p className="text-sm">{submitError}</p>
            </Alert>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            type="button"
            intent="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            intent="primary"
            disabled={
              isSubmitting ||
              isLoadingClients ||
              !!clientsError ||
              clients.length === 0
            }
            isLoading={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Creating...' : 'Create Product'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
