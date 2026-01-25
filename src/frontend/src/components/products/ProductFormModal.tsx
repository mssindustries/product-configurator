import { useState, useEffect, useCallback } from 'react';
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
  Input,
  Modal,
  Alert,
  Select,
  Textarea,
  FormField,
  useToast,
} from '../ui';
import { StyleFormModal } from './StyleFormModal';

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
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
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
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
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
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
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
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoadingClients, setIsLoadingClients] = useState(true);
  const [clientsError, setClientsError] = useState<string | null>(null);

  // Styles state (for edit mode)
  const [styles, setStyles] = useState<Style[]>([]);
  const [isLoadingStyles, setIsLoadingStyles] = useState(false);
  const [stylesError, setStylesError] = useState<string | null>(null);
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
   * Fetch styles for the product (edit mode only).
   */
  const fetchStyles = useCallback(async () => {
    if (!product) return;

    setIsLoadingStyles(true);
    setStylesError(null);

    try {
      const response = await getStyles(product.id);
      setStyles(response.items);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setStylesError(err.detail || err.message);
      } else if (err instanceof Error) {
        setStylesError(err.message);
      } else {
        setStylesError('Failed to load styles');
      }
    } finally {
      setIsLoadingStyles(false);
    }
  }, [product]);

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
        fetchStyles();
      } else {
        // Create mode: reset to initial state
        setFormData(initialFormData);
        setStyles([]);
        setActiveTab('basic');
      }
      setErrors({});
      setSubmitError(null);
      fetchClients();
    } else {
      // Reset justCreated when modal closes
      setJustCreated(false);
    }
  }, [isOpen, product, fetchClients, fetchStyles, justCreated]);

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
    fetchStyles();
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
      fetchStyles();
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
      fetchStyles();
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
                        <svg
                          className="w-4 h-4 mr-1"
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
                        Add Style
                      </Button>
                    </div>

                    {/* Styles Loading State */}
                    {isLoadingStyles && (
                      <div className="flex items-center justify-center py-8">
                        <svg
                          className="h-6 w-6 animate-spin text-neutral-400"
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
                        <span className="ml-2 text-neutral-500">Loading styles...</span>
                      </div>
                    )}

                    {/* Styles Error State */}
                    {!isLoadingStyles && stylesError && (
                      <Alert intent="danger">
                        <p className="text-sm">Failed to load styles: {stylesError}</p>
                        <button
                          type="button"
                          onClick={fetchStyles}
                          className="mt-2 text-sm font-medium text-danger-700 hover:text-danger-800 underline"
                        >
                          Try again
                        </button>
                      </Alert>
                    )}

                    {/* Styles Empty State */}
                    {!isLoadingStyles && !stylesError && styles.length === 0 && (
                      <div className="text-center py-8 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
                        <svg
                          className="mx-auto h-12 w-12 text-neutral-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                          />
                        </svg>
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
                          <svg
                            className="w-4 h-4 mr-1"
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
