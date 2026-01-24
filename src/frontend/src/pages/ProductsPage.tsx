import { useState, useEffect, useCallback, useMemo } from 'react';
import { getProducts, getClients, ApiClientError } from '../services/api';
import type { Product, Client } from '../types/api';
import { Button, Card, Alert } from '../components/ui';
import { CreateProductModal } from '../components/products';

/**
 * Format a date string to a human-readable format.
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Loading skeleton for product list.
 */
function LoadingSkeleton() {
  return (
    <Card>
      <div className="divide-y divide-neutral-200">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 animate-pulse">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="h-5 bg-neutral-200 rounded w-1/3 mb-2" />
                <div className="h-4 bg-neutral-200 rounded w-1/4 mb-1" />
                <div className="h-4 bg-neutral-200 rounded w-1/5" />
              </div>
              <div className="h-6 bg-neutral-200 rounded w-16" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Empty state when no products exist.
 */
function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <Card padding="lg">
      <div className="flex items-start gap-6">
        <div className="flex-shrink-0">
          <svg
            className="h-16 w-16 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-neutral-900 mb-2">
            No products yet
          </h3>
          <p className="text-neutral-500 mb-6">
            Get started by adding your first product. Products define the 3D configurator
            templates that your clients can customize.
          </p>
          <Button intent="primary" onClick={onAddClick}>
            <svg
              className="w-5 h-5 mr-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Your First Product
          </Button>
        </div>
      </div>
    </Card>
  );
}

/**
 * Error state with retry button.
 */
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="text-center">
      <Alert intent="danger" className="mb-6">
        <div className="flex flex-col items-center py-4">
          <svg
            className="h-12 w-12 text-danger-500 mb-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h3 className="text-lg font-medium text-neutral-800 mb-2">
            Failed to load products
          </h3>
          <p className="text-neutral-600 mb-4">{message}</p>
          <Button intent="danger" onClick={onRetry}>
            Try Again
          </Button>
        </div>
      </Alert>
    </div>
  );
}

/**
 * Product row component with enhanced display.
 */
function ProductRow({
  product,
  clientName,
}: {
  product: Product;
  clientName: string;
}) {
  return (
    <div className="p-4 hover:bg-neutral-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-neutral-900 truncate">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-sm text-neutral-600 line-clamp-1 mt-0.5">
              {product.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-1">
            <span className="inline-flex items-center text-sm text-neutral-500">
              <svg
                className="w-4 h-4 mr-1 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
              {clientName}
            </span>
            <span className="text-neutral-300">|</span>
            <span className="text-sm text-neutral-500">
              Created {formatDate(product.created_at)}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700">
            v{product.template_version}
          </span>
        </div>
      </div>
    </div>
  );
}

/**
 * ProductsPage - View and manage products.
 */
export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Create client lookup map for O(1) name resolution
  const clientsMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients]
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Fetch both products and clients in parallel
      const [productsResponse, clientsResponse] = await Promise.all([
        getProducts(),
        getClients(),
      ]);
      setProducts(productsResponse.items);
      setClients(clientsResponse.items);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddProduct = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleProductCreated = () => {
    // Refresh the product list after successful creation
    fetchData();
  };

  /**
   * Get client name from lookup map, with fallback for deleted clients.
   */
  const getClientName = (clientId: string): string => {
    const client = clientsMap.get(clientId);
    return client?.name ?? 'Unknown Client';
  };

  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Products</h1>
            <p className="text-neutral-600 mt-1">
              Manage your product catalog and 3D configurator templates.
            </p>
          </div>
          {!isLoading && !error && products.length > 0 && (
            <Button intent="primary" onClick={handleAddProduct}>
              <svg
                className="w-5 h-5 mr-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Product
            </Button>
          )}
        </div>

        {isLoading && <LoadingSkeleton />}

        {!isLoading && error && (
          <ErrorState message={error} onRetry={fetchData} />
        )}

        {!isLoading && !error && products.length === 0 && (
          <EmptyState onAddClick={handleAddProduct} />
        )}

        {!isLoading && !error && products.length > 0 && (
          <Card>
            <div className="divide-y divide-neutral-200">
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  clientName={getClientName(product.client_id)}
                />
              ))}
            </div>
          </Card>
        )}

        <CreateProductModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleProductCreated}
        />
      </div>
    </div>
  );
}
