import { Card, Icon } from '@/components/ui';

/**
 * ClientPage - The customer-facing view for product configuration.
 * This is the starting point for client users to browse and configure products.
 */
export default function ClientPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Product Configurator</h1>
        <p className="text-neutral-600 mb-8">
          Welcome! Browse and configure your custom products.
        </p>

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
      </div>
    </div>
  );
}
