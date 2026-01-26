import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Textarea variants using CVA.
 */
const textareaVariants = cva(
  'w-full rounded-md border transition-colors focus:outline-none focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50 resize-y',
  {
    variants: {
      variant: {
        default:
          'border-neutral-300 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-primary-500 focus:ring-primary-500',
        error:
          'border-danger-500 bg-white text-neutral-900 placeholder:text-neutral-400 focus:border-danger-500 focus:ring-danger-500',
      },
      textareaSize: {
        sm: 'px-2 py-1.5 text-sm',
        md: 'px-3 py-2 text-sm',
        lg: 'px-4 py-3 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      textareaSize: 'md',
    },
  }
);

export interface TextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'>,
    VariantProps<typeof textareaVariants> {
  /** Error state - applies error styling */
  error?: boolean;
}

/**
 * Textarea component with consistent styling and variants.
 *
 * @example
 * <Textarea placeholder="Enter description" rows={4} />
 * <Textarea variant="error" placeholder="Invalid input" />
 * <Textarea textareaSize="lg" />
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, variant, textareaSize, error, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          textareaVariants({ variant: error ? 'error' : variant, textareaSize }),
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export { Textarea, textareaVariants };
