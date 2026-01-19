import { forwardRef, type HTMLAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Alert variants using CVA.
 */
const alertVariants = cva('rounded-md border p-4', {
  variants: {
    intent: {
      info: 'bg-primary-50 border-primary-200 text-primary-800',
      success: 'bg-success-50 border-success-500/20 text-success-700',
      warning: 'bg-warning-50 border-warning-500/20 text-warning-700',
      danger: 'bg-danger-50 border-danger-200 text-danger-700',
    },
  },
  defaultVariants: {
    intent: 'info',
  },
});

export interface AlertProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {}

/**
 * Alert component for displaying messages.
 *
 * @example
 * <Alert intent="danger">Something went wrong</Alert>
 * <Alert intent="success">Changes saved!</Alert>
 */
const Alert = forwardRef<HTMLDivElement, AlertProps>(
  ({ className, intent, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={cn(alertVariants({ intent }), className)}
        {...props}
      />
    );
  }
);

Alert.displayName = 'Alert';

export { Alert, alertVariants };
