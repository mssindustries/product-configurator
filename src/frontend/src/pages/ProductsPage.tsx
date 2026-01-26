import { useState, useMemo } from 'react';
import { getProducts, getClients } from '../services/api';
import type { Product } from '../types/api';
import {
  Button,
  Card,
  Icon,
  ListSkeleton,
  EmptyState,
  ErrorState,
} from '../components/ui';
import { ProductFormModal } from '../components/products';
import { useList } from '../hooks';
import { formatDate } from '../lib/format';

/**
 * Product row component with enhanced display.
 */
function ProductRow({
  product,
  clientName,
  onEdit,
}: {
  product: Product;
  clientName: string;
  onEdit: (product: Product) => void;
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
              <Icon name="building" size="sm" className="mr-1 text-neutral-400" />
              {clientName}
            </span>
            <span className="text-neutral-300">|</span>
            <span className="text-sm text-neutral-500">
              Created {formatDate(product.created_at)}
            </span>
          </div>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label={`Edit ${product.name}`}
          >
            <Icon name="edit" size="md" />
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * ProductsPage - View and manage products.
 */
export default function ProductsPage() {
  const { items: products, isLoading: isLoadingProducts, error: productsError, refetch: refetchProducts } = useList(getProducts);
  const { items: clients, isLoading: isLoadingClients, error: clientsError } = useList(getClients);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);

  // Combine loading and error states
  const isLoading = isLoadingProducts || isLoadingClients;
  const error = productsError || clientsError;

  // Create client lookup map for O(1) name resolution
  const clientsMap = useMemo(
    () => new Map(clients.map((c) => [c.id, c])),
    [clients]
  );

  const handleAddProduct = () => {
    setSelectedProduct(undefined);
    setIsModalOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProduct(undefined);
  };

  const handleProductSaved = () => {
    // Refresh the product list after successful creation or update
    refetchProducts();
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
              <Icon name="plus" size="md" className="mr-1" />
              Add Product
            </Button>
          )}
        </div>

        {isLoading && (
          <ListSkeleton rows={3} config={{ lines: 3, widths: ['w-1/3', 'w-1/4', 'w-1/5'] }} />
        )}

        {!isLoading && error && (
          <ErrorState
            title="Failed to load products"
            message={error}
            onRetry={refetchProducts}
          />
        )}

        {!isLoading && !error && products.length === 0 && (
          <EmptyState
            icon="cube"
            title="No products yet"
            description="Get started by adding your first product. Products define the 3D configurator templates that your clients can customize."
            action={{ label: 'Add Your First Product', onClick: handleAddProduct }}
            layout="horizontal"
          />
        )}

        {!isLoading && !error && products.length > 0 && (
          <Card>
            <div className="divide-y divide-neutral-200">
              {products.map((product) => (
                <ProductRow
                  key={product.id}
                  product={product}
                  clientName={getClientName(product.client_id)}
                  onEdit={handleEditProduct}
                />
              ))}
            </div>
          </Card>
        )}

        <ProductFormModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSuccess={handleProductSaved}
          product={selectedProduct}
        />
      </div>
    </div>
  );
}
