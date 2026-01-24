import { Card } from '@/components/ui';

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
          <div className="text-center">
            <div className="bg-success-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-success-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-2">Client View</h2>
            <p className="text-neutral-600 max-w-md mx-auto">
              You are viewing the product configurator as a client. Use the role switcher in the
              top-right corner to switch to the admin view.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
