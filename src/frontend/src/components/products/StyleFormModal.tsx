import { useState, useEffect } from 'react';
import { createStyle, updateStyle, ApiClientError } from '../../services/api';
import type { Style } from '../../types/api';
import {
  Button,
  Input,
  Modal,
  Alert,
  Textarea,
  FormField,
  FileUpload,
  useToast,
  Tabs,
} from '../ui';

/**
 * Maximum file size for .blend files (100MB).
 */
const MAX_FILE_SIZE = 100 * 1024 * 1024;

/**
 * Form data for creating/editing a style.
 */
interface StyleFormData {
  name: string;
  description: string;
  file: File | null;
  customizationSchema: string;
  isDefault: boolean;
}

/**
 * Form validation errors.
 */
interface FormErrors {
  name?: string;
  file?: string;
  customizationSchema?: string;
}

/**
 * Initial form state.
 */
const initialFormData: StyleFormData = {
  name: '',
  description: '',
  file: null,
  customizationSchema: JSON.stringify(
    {
      type: 'object',
      properties: {},
    },
    null,
    2
  ),
  isDefault: false,
};

/**
 * Validates JSON syntax and returns error message if invalid.
 */
function validateJsonSyntax(value: string): string | undefined {
  if (!value.trim()) {
    return undefined;
  }
  try {
    JSON.parse(value);
    return undefined;
  } catch (err) {
    return `Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`;
  }
}

/**
 * Props for StyleFormModal.
 */
export interface StyleFormModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback when modal should close */
  onClose: () => void;
  /** Callback when style is successfully created or updated */
  onSuccess: (style: Style) => void;
  /** Product ID that this style belongs to */
  productId: string;
  /** Style to edit (if provided, modal is in edit mode) */
  style?: Style;
  /** Whether this is the first style for the product */
  isFirstStyle?: boolean;
}

/**
 * Modal for creating or editing a style.
 *
 * @example
 * // Create mode
 * <StyleFormModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSuccess={(style) => refetchStyles()}
 *   productId={product.id}
 * />
 *
 * // Edit mode
 * <StyleFormModal
 *   isOpen={isOpen}
 *   onClose={() => setIsOpen(false)}
 *   onSuccess={(style) => refetchStyles()}
 *   productId={product.id}
 *   style={styleToEdit}
 * />
 */
export function StyleFormModal({
  isOpen,
  onClose,
  onSuccess,
  productId,
  style,
  isFirstStyle = false,
}: StyleFormModalProps) {
  // Determine if we're in edit mode
  const isEditMode = !!style;
  // Toast for success notifications
  const { addToast } = useToast();

  // Form state
  const [formData, setFormData] = useState<StyleFormData>(initialFormData);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Reset form when modal opens/closes.
   * If editing, pre-fill form with existing style data.
   */
  useEffect(() => {
    if (isOpen) {
      if (style) {
        // Edit mode: pre-fill form with existing style data
        setFormData({
          name: style.name,
          description: style.description || '',
          file: null, // File is not pre-filled; user must re-select to change
          customizationSchema: JSON.stringify(style.customization_schema, null, 2),
          isDefault: style.is_default,
        });
      } else {
        // Create mode: reset to initial state
        setFormData({
          ...initialFormData,
          // Auto-set as default if this is the first style
          isDefault: isFirstStyle,
        });
      }
      setErrors({});
      setSubmitError(null);
    }
  }, [isOpen, style, isFirstStyle]);

  /**
   * Handle keyboard events for accessibility.
   */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      // Close modal on Escape (unless submitting)
      if (e.key === 'Escape' && !isSubmitting) {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  /**
   * Update a form field.
   */
  const updateField = <K extends keyof StyleFormData>(
    field: K,
    value: StyleFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear field error on change
    if (field in errors) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  /**
   * Handle file selection.
   */
  const handleFileSelect = (file: File | null) => {
    // Validate file size
    if (file && file.size > MAX_FILE_SIZE) {
      setErrors((prev) => ({
        ...prev,
        file: `File size exceeds maximum of 100MB. Selected file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`,
      }));
      return;
    }

    // Validate file extension
    if (file && !file.name.toLowerCase().endsWith('.blend')) {
      setErrors((prev) => ({
        ...prev,
        file: 'Only .blend files are accepted.',
      }));
      return;
    }

    updateField('file', file);
    setErrors((prev) => ({ ...prev, file: undefined }));
  };

  /**
   * Handle customization schema blur to validate JSON syntax.
   */
  const handleSchemaBlur = () => {
    const jsonError = validateJsonSyntax(formData.customizationSchema);
    if (jsonError) {
      setErrors((prev) => ({ ...prev, customizationSchema: jsonError }));
    }
  };

  /**
   * Validate form and return true if valid.
   */
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Style name is required';
    } else if (formData.name.length > 255) {
      newErrors.name = 'Style name must be 255 characters or less';
    }

    // File is required for create mode, optional for edit
    if (!isEditMode && !formData.file) {
      newErrors.file = 'Blender template file is required';
    }

    if (!formData.customizationSchema.trim()) {
      newErrors.customizationSchema = 'Customization schema is required';
    } else {
      const jsonError = validateJsonSyntax(formData.customizationSchema);
      if (jsonError) {
        newErrors.customizationSchema = jsonError;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Build FormData for API submission.
   */
  const buildFormData = (): FormData => {
    const apiFormData = new FormData();

    apiFormData.append('name', formData.name.trim());

    if (formData.description.trim()) {
      apiFormData.append('description', formData.description.trim());
    }

    if (formData.file) {
      apiFormData.append('file', formData.file);
    }

    apiFormData.append('customization_schema', formData.customizationSchema);
    apiFormData.append('is_default', String(formData.isDefault));

    return apiFormData;
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
      const apiFormData = buildFormData();

      let savedStyle: Style;

      if (isEditMode && style) {
        // Update existing style
        savedStyle = await updateStyle(productId, style.id, apiFormData);
        addToast('Style updated successfully!', 'success');
      } else {
        // Create new style
        savedStyle = await createStyle(productId, apiFormData);
        addToast(`Style "${formData.name.trim()}" created successfully!`, 'success');
      }

      onSuccess(savedStyle);
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setSubmitError(err.detail || err.message);
      } else if (err instanceof Error) {
        setSubmitError(
          isEditMode
            ? 'Failed to update style. Please try again.'
            : 'Failed to create style. Please try again.'
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
    if (!isSubmitting) {
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-3xl">
      <form onSubmit={handleSubmit}>
        <Modal.Header>
          <h2 className="text-xl font-semibold text-neutral-900">
            {isEditMode ? 'Edit Style' : 'Add New Style'}
          </h2>
        </Modal.Header>

        <Modal.Body className="p-0">
          <Tabs defaultTab="basic">
            <Tabs.List>
              <Tabs.Tab value="basic">Basic Information</Tabs.Tab>
              <Tabs.Tab value="schema">Customization Schema</Tabs.Tab>
            </Tabs.List>

            {/* Basic Info Tab */}
            <Tabs.Panel value="basic" className="p-6 space-y-4 max-h-[50vh] overflow-y-auto">
              {/* Style Name */}
              <FormField
                label="Style Name"
                required
                error={errors.name}
                id="style-name"
              >
                <Input
                  id="style-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., Open Style, Modern, Traditional"
                  error={!!errors.name}
                  disabled={isSubmitting}
                  maxLength={255}
                />
              </FormField>

              {/* Description */}
              <FormField label="Description" id="style-description">
                <Textarea
                  id="style-description"
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  placeholder="Enter style description (optional)"
                  disabled={isSubmitting}
                  rows={3}
                  maxLength={5000}
                />
              </FormField>

              {/* File Upload */}
              <FormField
                label="Blender Template"
                required={!isEditMode}
                error={errors.file}
                hint={
                  isEditMode
                    ? 'Leave empty to keep the current template file'
                    : undefined
                }
                id="style-file"
              >
                <FileUpload
                  accept=".blend"
                  maxSize={MAX_FILE_SIZE}
                  file={formData.file}
                  onFileSelect={handleFileSelect}
                  error={!!errors.file}
                  disabled={isSubmitting}
                  fileTypeLabel="Blender Template"
                  formatHint=".blend file (max 100MB)"
                />
              </FormField>

              {/* Is Default Checkbox */}
              {!isFirstStyle && (
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="style-is-default"
                    checked={formData.isDefault}
                    onChange={(e) => updateField('isDefault', e.target.checked)}
                    disabled={isSubmitting || (isEditMode && style?.is_default)}
                    className="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                  />
                  <label
                    htmlFor="style-is-default"
                    className="text-sm text-neutral-700"
                  >
                    Set as default style
                    {isEditMode && style?.is_default && (
                      <span className="text-neutral-500 ml-1">(already default)</span>
                    )}
                  </label>
                </div>
              )}

              {isFirstStyle && (
                <Alert intent="info">
                  <p className="text-sm">
                    This will be the first style for this product and will automatically be set as the default.
                  </p>
                </Alert>
              )}
            </Tabs.Panel>

            {/* Customization Schema Tab */}
            <Tabs.Panel value="schema" className="p-6 h-[50vh] flex flex-col">
              <FormField
                label="Customization Schema (JSON)"
                required
                error={errors.customizationSchema}
                hint="Define the JSON Schema that controls which options customers can configure"
                id="style-schema"
                className="flex-1 flex flex-col"
              >
                <Textarea
                  id="style-schema"
                  value={formData.customizationSchema}
                  onChange={(e) => updateField('customizationSchema', e.target.value)}
                  onBlur={handleSchemaBlur}
                  placeholder='{"type": "object", "properties": {...}}'
                  error={!!errors.customizationSchema}
                  disabled={isSubmitting}
                  className="font-mono text-sm flex-1 min-h-0"
                />
              </FormField>
            </Tabs.Panel>
          </Tabs>

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
            Cancel
          </Button>
          <Button
            type="submit"
            intent="primary"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            className="flex-1"
          >
            {isSubmitting
              ? isEditMode
                ? 'Updating...'
                : 'Creating...'
              : isEditMode
                ? 'Update Style'
                : 'Create Style'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
