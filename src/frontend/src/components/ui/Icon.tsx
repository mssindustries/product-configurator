import { forwardRef, type SVGAttributes } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../lib/utils';

/**
 * Available icon names.
 */
export type IconName =
  | 'building'
  | 'check'
  | 'checkCircle'
  | 'chevronDown'
  | 'cube'
  | 'document'
  | 'edit'
  | 'home'
  | 'info'
  | 'plus'
  | 'spinner'
  | 'star'
  | 'styles'
  | 'trash'
  | 'upload'
  | 'warning'
  | 'x';

/**
 * Icon size variants using CVA.
 */
const iconVariants = cva('flex-shrink-0', {
  variants: {
    size: {
      xs: 'w-3 h-3',
      sm: 'w-4 h-4',
      md: 'w-5 h-5',
      lg: 'w-6 h-6',
      xl: 'w-8 h-8',
      '2xl': 'w-12 h-12',
      '3xl': 'w-16 h-16',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

export interface IconProps
  extends Omit<SVGAttributes<SVGSVGElement>, 'children'>,
    VariantProps<typeof iconVariants> {
  /** The icon to display */
  name: IconName;
}

/**
 * SVG path data for each icon.
 * Icons are from Heroicons (https://heroicons.com/)
 */
const iconPaths: Record<
  IconName,
  {
    path: string;
    strokeWidth?: number;
    filled?: boolean;
  }
> = {
  building: {
    path: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    strokeWidth: 2,
  },
  check: {
    path: 'M5 13l4 4L19 7',
    strokeWidth: 2,
  },
  checkCircle: {
    path: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    strokeWidth: 2,
  },
  chevronDown: {
    path: 'M19 9l-7 7-7-7',
    strokeWidth: 2,
  },
  cube: {
    path: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    strokeWidth: 2,
  },
  document: {
    path: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    strokeWidth: 2,
  },
  edit: {
    path: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
    strokeWidth: 2,
  },
  home: {
    path: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    strokeWidth: 2,
  },
  info: {
    path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    strokeWidth: 2,
  },
  plus: {
    path: 'M12 4v16m8-8H4',
    strokeWidth: 2,
  },
  spinner: {
    // Special case: spinner has two paths (circle + arc)
    path: '',
    strokeWidth: 4,
  },
  star: {
    path: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
    strokeWidth: 2,
  },
  styles: {
    path: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    strokeWidth: 1.5,
  },
  trash: {
    path: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16',
    strokeWidth: 2,
  },
  upload: {
    path: 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
    strokeWidth: 2,
  },
  warning: {
    path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    strokeWidth: 2,
  },
  x: {
    path: 'M6 18L18 6M6 6l12 12',
    strokeWidth: 2,
  },
};

/**
 * Icon component for displaying SVG icons.
 *
 * @example
 * // Basic usage
 * <Icon name="plus" />
 *
 * // With size
 * <Icon name="edit" size="lg" />
 *
 * // With custom className
 * <Icon name="warning" className="text-danger-500" />
 *
 * // With animation
 * <Icon name="spinner" className="animate-spin" />
 */
const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ name, size, className, ...props }, ref) => {
    const iconConfig = iconPaths[name];

    // Special handling for spinner icon
    if (name === 'spinner') {
      return (
        <svg
          ref={ref}
          className={cn(iconVariants({ size }), className)}
          fill="none"
          viewBox="0 0 24 24"
          aria-hidden="true"
          {...props}
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
      );
    }

    return (
      <svg
        ref={ref}
        className={cn(iconVariants({ size }), className)}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
        {...props}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={iconConfig.strokeWidth}
          d={iconConfig.path}
        />
      </svg>
    );
  }
);

Icon.displayName = 'Icon';

export { Icon, iconVariants };
