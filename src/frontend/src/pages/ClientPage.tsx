import { Card, Icon } from '@/components/ui';
import { PageLayout } from '@/components/layout';

/**
 * ClientPage - The customer-facing view for product customization.
 * This is the starting point for client users to browse and configure products.
 */
export default function ClientPage() {
  return (
    <PageLayout
      title="Product Configurator"
      description="Welcome! Browse and configure your custom products."
    >
      <Card className="p-8">
        <div className="flex items-start gap-6">
          <div className="flex-shrink-0">
            <div className="bg-success-50 w-16 h-16 rounded-full flex items-center justify-center">
              <Icon name="cube" size="xl" className="text-success-600" />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Client View</h2>
            <p className="text-neutral-600">
              You are viewing the product configurator as a client. Use the role switcher in the
              top-right corner to switch to the admin view.
            </p>
          </div>
        </div>
      </Card>
    </PageLayout>
  );
}
