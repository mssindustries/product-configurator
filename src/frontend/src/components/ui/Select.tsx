import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Select variants using CVA.
 */
const selectVariants = cva(
  'w-full rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-no-repeat bg-right',
  {
    variants: {
      variant: {
        default:
          'border-neutral-300 bg-white text-neutral-900 focus:border-primary-500 focus:ring-primary-500',
        error:
          'border-danger-500 bg-white text-neutral-900 focus:border-danger-500 focus:ring-danger-500',
      },
      selectSize: {
        sm: 'h-8 px-2 pr-8 text-sm',
        md: 'h-10 px-3 pr-10 text-sm',
        lg: 'h-12 px-4 pr-12 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      selectSize: 'md',
    },
  }
);

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectVariants> {
  /** Error state - applies error styling */
  error?: boolean;
  /** Placeholder text shown when no value is selected */
  placeholder?: string;
  /** Options to display in the dropdown */
  options?: SelectOption[];
}

/**
 * Select component with consistent styling and variants.
 *
 * @example
 * <Select
 *   placeholder="Select a client"
 *   options={[{ value: '1', label: 'Client 1' }]}
 * />
 * <Select variant="error" />
 * <Select selectSize="lg" />
 */
const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    { className, variant, selectSize, error, placeholder, options, children, ...props },
    ref
  ) => {
    // Chevron down SVG as background image (encoded)
    const chevronSvg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`;

    return (
      <select
        className={cn(
          selectVariants({ variant: error ? 'error' : variant, selectSize }),
          className
        )}
        style={{
          backgroundImage: chevronSvg,
          backgroundPosition: 'right 0.5rem center',
          backgroundSize: '1.5em 1.5em',
        }}
        ref={ref}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options?.map((option) => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ))}
        {children}
      </select>
    );
  }
);

Select.displayName = 'Select';

export { Select, selectVariants };
