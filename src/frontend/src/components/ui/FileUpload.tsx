import { forwardRef, useRef, type InputHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';

/**
 * FileUpload variants using CVA.
 */
const fileUploadVariants = cva(
  // Base styles
  'relative flex flex-col items-center justify-center w-full border-2 border-dashed rounded-lg cursor-pointer transition-colors',
  {
    variants: {
      state: {
        default: 'border-neutral-300 bg-neutral-50 hover:bg-neutral-100 hover:border-neutral-400',
        error: 'border-danger-300 bg-danger-50 hover:bg-danger-100',
        hasFile: 'border-primary-300 bg-primary-50 hover:bg-primary-100',
        disabled: 'border-neutral-200 bg-neutral-100 cursor-not-allowed opacity-60',
      },
      size: {
        sm: 'min-h-24 p-3',
        md: 'min-h-32 p-4',
        lg: 'min-h-40 p-6',
      },
    },
    defaultVariants: {
      state: 'default',
      size: 'md',
    },
  }
);

export interface FileUploadProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>,
    VariantProps<typeof fileUploadVariants> {
  /** Accepted file types (e.g., ".blend") */
  accept?: string;
  /** Maximum file size in bytes */
  maxSize?: number;
  /** Current selected file (controlled) */
  file?: File | null;
  /** Callback when file is selected */
  onFileSelect?: (file: File | null) => void;
  /** Error state */
  error?: boolean;
  /** File type label (e.g., "Blender Template") */
  fileTypeLabel?: string;
  /** Hint text for accepted formats */
  formatHint?: string;
}

/**
 * Format file size for display.
 */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * FileUpload component for uploading files with drag-and-drop support.
 *
 * @example
 * <FileUpload
 *   accept=".blend"
 *   maxSize={100 * 1024 * 1024}
 *   file={selectedFile}
 *   onFileSelect={setSelectedFile}
 *   fileTypeLabel="Blender Template"
 *   formatHint=".blend file (max 100MB)"
 * />
 */
const FileUpload = forwardRef<HTMLInputElement, FileUploadProps>(
  (
    {
      className,
      accept,
      // maxSize and fileTypeLabel are available in props for consumer reference
      // but validation is handled by the parent component
      maxSize,
      fileTypeLabel,
      file,
      onFileSelect,
      error,
      disabled,
      formatHint,
      size,
      ...inputProps
    },
    ref
  ) => {
    // Suppress unused variable warnings - these props are part of the component API
    // for documentation/type-checking purposes but validation is in the parent
    void maxSize;
    void fileTypeLabel;
    const inputRef = useRef<HTMLInputElement>(null);

    // Determine state variant
    const state = disabled
      ? 'disabled'
      : error
        ? 'error'
        : file
          ? 'hasFile'
          : 'default';

    const handleClick = () => {
      if (!disabled) {
        inputRef.current?.click();
      }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0] || null;
      onFileSelect?.(selectedFile);
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      onFileSelect?.(null);
      if (inputRef.current) {
        inputRef.current.value = '';
      }
    };

    const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (disabled) return;

      const droppedFile = e.dataTransfer.files?.[0];
      if (droppedFile) {
        onFileSelect?.(droppedFile);
      }
    };

    return (
      <div
        className={cn(fileUploadVariants({ state, size }), className)}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
        aria-disabled={disabled}
      >
        <input
          ref={(node) => {
            // Handle both internal ref and forwarded ref
            if (typeof ref === 'function') {
              ref(node);
            } else if (ref) {
              ref.current = node;
            }
            (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
          }}
          type="file"
          className="sr-only"
          accept={accept}
          onChange={handleChange}
          disabled={disabled}
          {...inputProps}
        />

        {file ? (
          // File selected state
          <div className="flex flex-col items-center text-center">
            <Icon name="checkCircle" size="xl" className="text-primary-500 mb-2" />
            <p className="text-sm font-medium text-neutral-900 truncate max-w-full px-2">
              {file.name}
            </p>
            <p className="text-xs text-neutral-500 mt-1">
              {formatFileSize(file.size)}
            </p>
            <button
              type="button"
              onClick={handleClear}
              className="mt-2 text-xs text-primary-600 hover:text-primary-700 font-medium focus:outline-none focus:underline"
            >
              Remove file
            </button>
          </div>
        ) : (
          // Empty state
          <div className="flex flex-col items-center text-center">
            <Icon name="upload" size="xl" className="text-neutral-400 mb-2" />
            <p className="text-sm text-neutral-600">
              <span className="font-medium text-primary-600">Click to upload</span>
              {' '}or drag and drop
            </p>
            {formatHint && (
              <p className="text-xs text-neutral-500 mt-1">{formatHint}</p>
            )}
          </div>
        )}
      </div>
    );
  }
);

FileUpload.displayName = 'FileUpload';

export { FileUpload, fileUploadVariants };
