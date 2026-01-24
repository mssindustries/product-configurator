import { Link } from 'react-router-dom';
import { Card } from '../components/ui';

/**
 * AdminPage - Main admin dashboard with navigation to admin sections.
 */
export default function AdminPage() {
  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-neutral-900 mb-2">Admin Dashboard</h1>
        <p className="text-neutral-600 mb-8">Manage your MSS Industries configurator.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/clients">
            <Card className="p-6 hover:shadow-lg transition-shadow group">
              <div className="flex items-center gap-4">
                <div className="bg-primary-100 p-3 rounded-lg group-hover:bg-primary-200 transition-colors">
                  <svg
                    className="w-8 h-8 text-primary-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                    Clients
                  </h2>
                  <p className="text-sm text-neutral-500">Manage client accounts</p>
                </div>
              </div>
            </Card>
          </Link>

          <Link to="/products">
            <Card className="p-6 hover:shadow-lg transition-shadow group">
              <div className="flex items-center gap-4">
                <div className="bg-primary-100 p-3 rounded-lg group-hover:bg-primary-200 transition-colors">
                  <svg
                    className="w-8 h-8 text-primary-600"
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
                <div>
                  <h2 className="text-lg font-semibold text-neutral-900 group-hover:text-primary-600 transition-colors">
                    Products
                  </h2>
                  <p className="text-sm text-neutral-500">Manage product catalog</p>
                </div>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
