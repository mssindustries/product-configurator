/**
 * Page State Components
 *
 * Generic loading, empty, and error state components for list pages.
 * Eliminates duplication of these common UI patterns.
 */

import { Card } from './Card';
import { Alert } from './Alert';
import { Button } from './Button';
import { Icon, type IconName } from './Icon';

/**
 * Configuration for customizing skeleton row structure.
 */
export interface SkeletonRowConfig {
  /** Number of skeleton lines per row */
  lines?: 1 | 2 | 3;
  /** Width classes for each line (e.g., ['w-1/3', 'w-1/4']) */
  widths?: string[];
}

export interface ListSkeletonProps {
  /** Number of skeleton rows to display */
  rows?: number;
  /** Configuration for skeleton row structure */
  config?: SkeletonRowConfig;
}

/**
 * Loading skeleton for list views.
 * Displays animated placeholder rows while data is loading.
 *
 * @example
 * // Simple skeleton with default 3 rows
 * <ListSkeleton />
 *
 * @example
 * // Custom number of rows with 2 lines each
 * <ListSkeleton rows={5} config={{ lines: 2, widths: ['w-1/3', 'w-1/4'] }} />
 */
export function ListSkeleton({ rows = 3, config = {} }: ListSkeletonProps) {
  const { lines = 2, widths = ['w-1/3', 'w-1/4'] } = config;

  return (
    <Card>
      <div className="divide-y divide-neutral-200">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="p-4 animate-pulse">
            <div className="space-y-2">
              {Array.from({ length: lines }, (_, lineIdx) => (
                <div
                  key={lineIdx}
                  className={`h-${lineIdx === 0 ? '5' : '4'} bg-neutral-200 rounded ${
                    widths[lineIdx] || 'w-1/4'
                  } ${lineIdx > 0 ? 'mb-1' : 'mb-2'}`}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export interface EmptyStateProps {
  /** Icon name to display */
  icon: IconName;
  /** Main heading text */
  title: string;
  /** Description text */
  description: string;
  /** Optional action button */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Layout variant: 'centered' (icon on top) or 'horizontal' (icon on left) */
  layout?: 'centered' | 'horizontal';
}

/**
 * Empty state component for when no data exists.
 * Displays an icon, message, and optional action button.
 *
 * @example
 * // Centered layout (default)
 * <EmptyState
 *   icon="building"
 *   title="No clients yet"
 *   description="Get started by adding your first client."
 *   action={{ label: "Add Client", onClick: handleAdd }}
 * />
 *
 * @example
 * // Horizontal layout
 * <EmptyState
 *   icon="cube"
 *   title="No products yet"
 *   description="Get started by adding your first product."
 *   layout="horizontal"
 * />
 */
export function EmptyState({
  icon,
  title,
  description,
  action,
  layout = 'centered',
}: EmptyStateProps) {
  if (layout === 'horizontal') {
    return (
      <Card padding="lg">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <Icon name={icon} size="3xl" className="text-neutral-400" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium text-neutral-900 mb-2">{title}</h3>
            <p className="text-neutral-500 mb-6">{description}</p>
            {action && (
              <Button intent="primary" onClick={action.onClick}>
                <Icon name="plus" size="md" className="mr-1" />
                {action.label}
              </Button>
            )}
          </div>
        </div>
      </Card>
    );
  }

  // Centered layout (default)
  return (
    <Card padding="lg" className="text-center">
      <Icon name={icon} size="3xl" className="mx-auto text-neutral-400 mb-4" />
      <h3 className="text-lg font-medium text-neutral-900 mb-2">{title}</h3>
      <p className="text-neutral-500 mb-6">{description}</p>
      {action && (
        <Button intent="primary" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </Card>
  );
}

export interface ErrorStateProps {
  /** Error title */
  title?: string;
  /** Error message to display */
  message: string;
  /** Retry callback function */
  onRetry: () => void;
  /** Optional custom retry button text */
  retryText?: string;
}

/**
 * Error state component with retry functionality.
 * Displays an error message with a retry button.
 *
 * @example
 * <ErrorState
 *   title="Failed to load clients"
 *   message={error}
 *   onRetry={refetch}
 * />
 */
export function ErrorState({
  title = 'Failed to load data',
  message,
  onRetry,
  retryText = 'Try Again',
}: ErrorStateProps) {
  return (
    <div className="text-center">
      <Alert intent="danger" className="mb-6">
        <div className="flex flex-col items-center py-4">
          <Icon name="warning" size="2xl" className="text-danger-500 mb-4" />
          <h3 className="text-lg font-medium mb-2">{title}</h3>
          <p className="mb-4">{message}</p>
          <Button intent="danger" onClick={onRetry}>
            {retryText}
          </Button>
        </div>
      </Alert>
    </div>
  );
}
