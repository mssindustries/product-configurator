import { useState, useEffect } from 'react';
import {
  getClients,
  getStyles,
  deleteStyle,
  setDefaultStyle,
  createProduct,
  updateProduct,
  ApiClientError,
} from '../../services/api';
import type { Client, Product, Style } from '../../types/api';
import {
  Button,
  Icon,
  Input,
  Modal,
  Alert,
  Select,
  Textarea,
  FormField,
  useToast,
} from '../ui';
import { StyleFormModal } from './StyleFormModal';
import { useList } from '../../hooks';

/**
 * Form data for creating/editing a product.
 */
interface ProductFormData {
  clientId: string;
  name: string;
  description: string;
}

/**
 * Form validation errors.
 */
interface FormErrors {
  clientId?: string;
  name?: string;
}

/**
 * Initial form state.
 */
const initialFormData: ProductFormData = {
  clientId: '',
  name: '',
  description: '',
};

/**
 * Props for ProductFormModal.
 */
export interface ProductFormModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when product is successfully created or updated */
  onSuccess: () => void;
  /** Product to edit (if provided, modal is in edit mode) */
  product?: Product;
}

/**
 * Format a date string to a human-readable format.
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Style card component for displaying a style in the list.
 */
function StyleCard({
  style,
  onEdit,
  onSetDefault,
  onDelete,
  isDeleting,
  isSettingDefault,
}: {
  style: Style;
  onEdit: () => void;
  onSetDefault: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  isSettingDefault: boolean;
}) {
  return (
    <div className="flex items-start justify-between p-4 bg-neutral-50 rounded-lg border border-neutral-200">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-medium text-neutral-900 truncate">
            {style.name}
          </h4>
          {style.is_default && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-700">
              Default
            </span>
          )}
        </div>
        {style.description && (
          <p className="mt-1 text-sm text-neutral-500 line-clamp-2">
            {style.description}
          </p>
        )}
        <p className="mt-1 text-xs text-neutral-400">
          Created {formatDate(style.created_at)}
        </p>
      </div>
      <div className="flex items-center gap-1 ml-4">
        <button
          type="button"
          onClick={onEdit}
          disabled={isDeleting || isSettingDefault}
          className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Edit style"
        >
          <Icon name="edit" size="sm" />
        </button>
        {!style.is_default && (
          <>
            <button
              type="button"
              onClick={onSetDefault}
              disabled={isDeleting || isSettingDefault}
              className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Set as default"
            >
              {isSettingDefault ? (
                <Icon name="spinner" size="sm" className="animate-spin" />
              ) : (
                <Icon name="star" size="sm" />
              )}
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting || isSettingDefault}
              className="p-1.5 text-neutral-400 hover:text-danger-600 hover:bg-danger-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Delete style"
            >
              {isDeleting ? (
                <Icon name="spinner" size="sm" className="animate-spin" />
              ) : (
                <Icon name="trash" size="sm" />
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Modal for creating or editing a product.
 *
 * @example
 * // Create mode
 * <ProductFormModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSuccess={() => refetchProducts()}
 * />
 *
 * // Edit mode
 * <ProductFormModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSuccess={() => refetchProducts()}
 *   product={productToEdit}
 * />
 */
export function ProductFormModal({
  isOpen,
  onClose,
  onSuccess,
  product,
}: ProductFormModalProps) {
  // Determine if we're in edit mode
  const isEditMode = !!product;
  // Toast for success notifications
  const { addToast } = useToast();

  // Form state
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Client dropdown state
  const { items: clients, isLoading: isLoadingClients, error: clientsError, refetch: refetchClients } = useList(getClients, { immediate: false });

  // Styles state (for edit mode)
  const { items: styles, isLoading: isLoadingStyles, error: stylesError, refetch: refetchStyles } = useList(
    () => getStyles(product?.id || ''),
    { immediate: false }
  );
  const [deletingStyleId, setDeletingStyleId] = useState<string | null>(null);
  const [settingDefaultStyleId, setSettingDefaultStyleId] = useState<string | null>(null);

  // Style form modal state
  const [isStyleModalOpen, setIsStyleModalOpen] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<Style | undefined>(undefined);

  // Track if we just created a product (to switch to Styles tab)
  const [justCreated, setJustCreated] = useState(false);

  // Active tab state for controlled tabs
  const [activeTab, setActiveTab] = useState('basic');


  /**
   * Reset form when modal opens/closes.
   * If editing, pre-fill form with existing product data.
   */
  useEffect(() => {
    if (isOpen) {
      if (product) {
        // Edit mode: pre-fill form with existing product data
        setFormData({
          clientId: product.client_id,
          name: product.name,
          description: product.description || '',
        });
        // Set tab based on justCreated flag
        setActiveTab(justCreated ? 'styles' : 'basic');
        refetchStyles();
      } else {
        // Create mode: reset to initial state
        setFormData(initialFormData);
        setActiveTab('basic');
      }
      setErrors({});
      setSubmitError(null);
      refetchClients();
    } else {
      // Reset justCreated when modal closes
      setJustCreated(false);
    }
  }, [isOpen, product, refetchClients, refetchStyles, justCreated]);

  /**
   * Handle keyboard events for accessibility.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Close modal on Escape (unless submitting or style modal is open)
      if (e.key === 'Escape' && !isSubmitting && !isStyleModalOpen) {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, isStyleModalOpen, onClose]);

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
      if (isEditMode && product) {
        // Update existing product
        await updateProduct(product.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        });
        addToast('Product updated successfully!', 'success');
        onSuccess();
        onClose();
      } else {
        // Create new product
        await createProduct({
          client_id: formData.clientId,
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
        });
        addToast(
          `Product "${formData.name.trim()}" created! Now add styles to define variants.`,
          'success'
        );
        // Don't close the modal - switch to styles tab for the new product
        // We need to trigger a re-render with the new product in edit mode
        setJustCreated(true);
        onSuccess();
        // Note: The parent component needs to re-open the modal with the new product
        // For now, we'll close and let the user re-open in edit mode
        onClose();
      }
    } catch (err) {
      if (err instanceof ApiClientError) {
        setSubmitError(err.detail || err.message);
      } else if (err instanceof Error) {
        setSubmitError(
          isEditMode
            ? 'Failed to update product. Please try again.'
            : 'Failed to create product. Please try again.'
        );
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
    if (!isSubmitting && !isStyleModalOpen) {
      onClose();
    }
  };

  /**
   * Handle add style button click.
   */
  const handleAddStyle = () => {
    setSelectedStyle(undefined);
    setIsStyleModalOpen(true);
  };

  /**
   * Handle edit style button click.
   */
  const handleEditStyle = (style: Style) => {
    setSelectedStyle(style);
    setIsStyleModalOpen(true);
  };

  /**
   * Handle style modal close.
   */
  const handleStyleModalClose = () => {
    setIsStyleModalOpen(false);
    setSelectedStyle(undefined);
  };

  /**
   * Handle style created/updated.
   */
  const handleStyleSuccess = () => {
    refetchStyles();
  };

  /**
   * Handle set default style.
   */
  const handleSetDefaultStyle = async (styleId: string) => {
    if (!product) return;

    setSettingDefaultStyleId(styleId);

    try {
      await setDefaultStyle(product.id, styleId);
      addToast('Default style updated!', 'success');
      refetchStyles();
    } catch (err) {
      if (err instanceof ApiClientError) {
        addToast(err.detail || 'Failed to set default style', 'danger');
      } else {
        addToast('Failed to set default style', 'danger');
      }
    } finally {
      setSettingDefaultStyleId(null);
    }
  };

  /**
   * Handle delete style.
   */
  const handleDeleteStyle = async (style: Style) => {
    if (!product) return;

    // Confirm deletion
    if (!window.confirm(`Are you sure you want to delete the style "${style.name}"?`)) {
      return;
    }

    setDeletingStyleId(style.id);

    try {
      await deleteStyle(product.id, style.id);
      addToast(`Style "${style.name}" deleted`, 'success');
      refetchStyles();
    } catch (err) {
      if (err instanceof ApiClientError) {
        addToast(err.detail || 'Failed to delete style', 'danger');
      } else {
        addToast('Failed to delete style', 'danger');
      }
    } finally {
      setDeletingStyleId(null);
    }
  };

  // Convert clients to select options
  const clientOptions = clients.map((client) => ({
    value: client.id,
    label: client.name,
  }));

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} className="max-w-4xl">
        <form onSubmit={handleSubmit}>
          <Modal.Header>
            <h2 className="text-xl font-semibold text-neutral-900">
              {isEditMode ? 'Edit Product' : 'Create New Product'}
            </h2>
          </Modal.Header>

          <Modal.Body className="p-0">
            {/* Client Loading State */}
            {isLoadingClients && (
              <div className="flex items-center gap-2 text-neutral-500 py-6 px-6">
                <Icon name="spinner" size="md" className="animate-spin" />
                <span>Loading clients...</span>
              </div>
            )}

            {/* Client Error State */}
            {!isLoadingClients && clientsError && (
              <div className="px-6 py-4">
                <Alert intent="danger">
                  <p className="text-sm">Failed to load clients: {clientsError}</p>
                </Alert>
              </div>
            )}

            {/* No Clients Warning */}
            {!isLoadingClients && !clientsError && clients.length === 0 && (
              <div className="px-6 py-4">
                <Alert intent="warning">
                  <p className="text-sm">
                    No clients available. Please create a client first.
                  </p>
                </Alert>
              </div>
            )}

            {/* Tabbed Form - Only show when clients loaded successfully */}
            {!isLoadingClients && !clientsError && clients.length > 0 && (
              <div>
                <div
                  role="tablist"
                  className="flex border-b border-neutral-200"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'basic'}
                    onClick={() => setActiveTab('basic')}
                    className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                      activeTab === 'basic'
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
                    }`}
                  >
                    Basic Information
                  </button>
                  {isEditMode && (
                    <button
                      type="button"
                      role="tab"
                      aria-selected={activeTab === 'styles'}
                      onClick={() => setActiveTab('styles')}
                      className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 -mb-px focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
                        activeTab === 'styles'
                          ? 'border-primary-500 text-primary-600'
                          : 'border-transparent text-neutral-600 hover:text-neutral-900 hover:border-neutral-300'
                      }`}
                    >
                      Styles
                      {styles.length > 0 && (
                        <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-600">
                          {styles.length}
                        </span>
                      )}
                    </button>
                  )}
                </div>

                {/* Basic Info Tab */}
                {activeTab === 'basic' && (
                  <div className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
                    {/* Basic Info - Two columns on md+ screens */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Client Dropdown */}
                      <FormField
                        label="Client"
                        required
                        error={errors.clientId}
                        id="product-client"
                      >
                        <Select
                          id="product-client"
                          value={formData.clientId}
                          onChange={(e) => updateField('clientId', e.target.value)}
                          placeholder="Select a client"
                          options={clientOptions}
                          error={!!errors.clientId}
                          disabled={isSubmitting || isEditMode}
                        />
                      </FormField>

                      {/* Product Name */}
                      <FormField
                        label="Product Name"
                        required
                        error={errors.name}
                        id="product-name"
                      >
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
                      </FormField>
                    </div>

                    {/* Description - Full width */}
                    <FormField label="Description" id="product-description">
                      <Textarea
                        id="product-description"
                        value={formData.description}
                        onChange={(e) => updateField('description', e.target.value)}
                        placeholder="Enter product description (optional)"
                        disabled={isSubmitting}
                        rows={3}
                        maxLength={5000}
                      />
                    </FormField>

                    {!isEditMode && (
                      <Alert intent="info">
                        <p className="text-sm">
                          After creating the product, you can add styles to define different variants
                          (e.g., "Open Style", "Modern", "Traditional") with their own Blender
                          templates and customization options.
                        </p>
                      </Alert>
                    )}
                  </div>
                )}

                {/* Styles Tab (Edit mode only) */}
                {activeTab === 'styles' && isEditMode && (
                  <div className="p-6 max-h-[50vh] overflow-y-auto">
                    {/* Styles Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-sm font-medium text-neutral-900">
                          Styles for "{product?.name}"
                        </h3>
                        <p className="text-xs text-neutral-500 mt-0.5">
                          Each style has its own Blender template and customization schema
                        </p>
                      </div>
                      <Button
                        type="button"
                        intent="primary"
                        size="sm"
                        onClick={handleAddStyle}
                        disabled={isLoadingStyles}
                      >
                        <Icon name="plus" size="sm" className="mr-1" />
                        Add Style
                      </Button>
                    </div>

                    {/* Styles Loading State */}
                    {isLoadingStyles && (
                      <div className="flex items-center justify-center py-8">
                        <Icon name="spinner" size="lg" className="animate-spin text-neutral-400" />
                        <span className="ml-2 text-neutral-500">Loading styles...</span>
                      </div>
                    )}

                    {/* Styles Error State */}
                    {!isLoadingStyles && stylesError && (
                      <Alert intent="danger">
                        <p className="text-sm">Failed to load styles: {stylesError}</p>
                        <button
                          type="button"
                          onClick={refetchStyles}
                          className="mt-2 text-sm font-medium text-danger-700 hover:text-danger-800 underline"
                        >
                          Try again
                        </button>
                      </Alert>
                    )}

                    {/* Styles Empty State */}
                    {!isLoadingStyles && !stylesError && styles.length === 0 && (
                      <div className="text-center py-8 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
                        <Icon name="styles" size="2xl" className="mx-auto text-neutral-400" />
                        <h4 className="mt-2 text-sm font-medium text-neutral-900">
                          No styles yet
                        </h4>
                        <p className="mt-1 text-sm text-neutral-500">
                          Add your first style to define a product variant with its Blender template.
                        </p>
                        <Button
                          type="button"
                          intent="primary"
                          size="sm"
                          onClick={handleAddStyle}
                          className="mt-4"
                        >
                          <Icon name="plus" size="sm" className="mr-1" />
                          Add First Style
                        </Button>
                      </div>
                    )}

                    {/* Styles List */}
                    {!isLoadingStyles && !stylesError && styles.length > 0 && (
                      <div className="space-y-3">
                        {styles.map((style) => (
                          <StyleCard
                            key={style.id}
                            style={style}
                            onEdit={() => handleEditStyle(style)}
                            onSetDefault={() => handleSetDefaultStyle(style.id)}
                            onDelete={() => handleDeleteStyle(style)}
                            isDeleting={deletingStyleId === style.id}
                            isSettingDefault={settingDefaultStyleId === style.id}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Submit Error */}
            {submitError && (
              <div className="px-6 pb-4">
                <Alert intent="danger">
                  <p className="text-sm">{submitError}</p>
                </Alert>
              </div>
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
              {isEditMode ? 'Close' : 'Cancel'}
            </Button>
            {activeTab === 'basic' && (
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
                {isSubmitting
                  ? isEditMode
                    ? 'Updating...'
                    : 'Creating...'
                  : isEditMode
                    ? 'Update Product'
                    : 'Create Product'}
              </Button>
            )}
          </Modal.Footer>
        </form>
      </Modal>

      {/* Style Form Modal (nested) */}
      {isEditMode && product && (
        <StyleFormModal
          isOpen={isStyleModalOpen}
          onClose={handleStyleModalClose}
          onSuccess={handleStyleSuccess}
          productId={product.id}
          style={selectedStyle}
          isFirstStyle={styles.length === 0}
        />
      )}
    </>
  );
}
