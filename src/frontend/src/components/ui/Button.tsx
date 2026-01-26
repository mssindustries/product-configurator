import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';
import { Icon } from './Icon';

/**
 * Button variants using CVA.
 *
 * @variant intent - Visual style: primary, secondary, danger, ghost
 * @variant size - Button size: sm, md, lg
 */
const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      intent: {
        primary:
          'bg-primary-500 text-white hover:bg-primary-600 focus-visible:ring-primary-500',
        secondary:
          'bg-neutral-200 text-neutral-800 hover:bg-neutral-300 focus-visible:ring-neutral-500',
        danger:
          'bg-danger-500 text-white hover:bg-danger-600 focus-visible:ring-danger-500',
        ghost:
          'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 focus-visible:ring-neutral-500',
      },
      size: {
        sm: 'h-8 px-3 text-sm rounded-md',
        md: 'h-10 px-4 text-sm rounded-md',
        lg: 'h-12 px-6 text-base rounded-lg',
      },
    },
    defaultVariants: {
      intent: 'primary',
      size: 'md',
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Loading state - shows spinner and disables button */
  isLoading?: boolean;
}

/**
 * Button component with consistent styling and variants.
 *
 * @example
 * <Button intent="primary" size="md">Click me</Button>
 * <Button intent="danger" isLoading>Deleting...</Button>
 * <Button intent="ghost" size="sm">Cancel</Button>
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, intent, size, isLoading, disabled, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ intent, size }), className)}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && <Icon name="spinner" size="sm" className="animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };
