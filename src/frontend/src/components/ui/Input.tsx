import { forwardRef, type InputHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Input variants using CVA.
 */
const inputVariants = cva(
  'w-full rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-primary-500',
        error:
          'border-danger-500 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-danger-500 focus:ring-danger-500',
      },
      inputSize: {
        sm: 'h-8 px-2 text-sm',
        md: 'h-10 px-3 text-sm',
        lg: 'h-12 px-4 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      inputSize: 'md',
    },
  }
);

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  /** Error state - applies error styling */
  error?: boolean;
}

/**
 * Input component with consistent styling and variants.
 *
 * @example
 * <Input placeholder="Enter name" />
 * <Input variant="error" placeholder="Invalid input" />
 * <Input inputSize="lg" />
 */
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, variant, inputSize, error, ...props }, ref) => {
    return (
      <input
        className={cn(
          inputVariants({ variant: error ? 'error' : variant, inputSize }),
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input, inputVariants };
