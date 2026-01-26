import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface FormFieldProps {
  /** Label text for the form field */
  label: string;
  /** Whether the field is required */
  required?: boolean;
  /** Error message to display */
  error?: string;
  /** Hint text to display below the input */
  hint?: string;
  /** ID to associate label with input (for accessibility) */
  id?: string;
  /** Children elements (the actual input/select/textarea) */
  children: ReactNode;
  /** Optional class name for the wrapper */
  className?: string;
}

/**
 * FormField wrapper component for consistent form field styling.
 *
 * Provides a label with optional required indicator, children slot for
 * the input element, optional hint text, and error message display.
 *
 * @example
 * <FormField label="Email" required error={errors.email}>
 *   <Input type="email" error={!!errors.email} />
 * </FormField>
 *
 * @example
 * <FormField label="Bio" hint="Tell us about yourself" id="bio-field">
 *   <Textarea id="bio-field" />
 * </FormField>
 */
export function FormField({
  label,
  required,
  error,
  hint,
  id,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-1', className)}>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-neutral-700"
      >
        {label}
        {required && <span className="text-danger-500 ml-1">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="text-xs text-neutral-500">{hint}</p>
      )}
      {error && (
        <p className="text-sm text-danger-500">{error}</p>
      )}
    </div>
  );
}
