import { ReactNode } from 'react';

export interface PageLayoutProps {
  /**
   * Page title displayed at the top
   */
  title: string;
  /**
   * Optional description text below the title
   */
  description?: string;
  /**
   * Page content
   */
  children: ReactNode;
  /**
   * Maximum width constraint for the content area
   * @default '4xl'
   */
  maxWidth?: 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl' | 'full';
}

/**
 * PageLayout - Consistent page wrapper for admin pages.
 *
 * Provides the standard page structure with:
 * - Full-height neutral background
 * - Centered content container with configurable max-width
 * - Title and optional description
 *
 * Note: Action buttons should be placed outside this component in the parent,
 * typically alongside the title in a flex container.
 *
 * @example
 * ```tsx
 * <PageLayout title="Clients" description="Manage your client accounts.">
 *   <Card>...</Card>
 * </PageLayout>
 * ```
 */
export function PageLayout({
  title,
  description,
  children,
  maxWidth = '4xl',
}: PageLayoutProps) {
  const maxWidthClass = `max-w-${maxWidth}`;

  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      <div className={`${maxWidthClass} mx-auto`}>
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-neutral-900">{title}</h1>
          {description && (
            <p className="text-neutral-600 mt-1">{description}</p>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
