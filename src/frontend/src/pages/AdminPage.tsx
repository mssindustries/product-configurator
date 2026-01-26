import { Link } from 'react-router-dom';
import { Card, Icon } from '../components/ui';

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
                  <Icon name="building" size="xl" className="text-primary-600" />
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
                  <Icon name="cube" size="xl" className="text-primary-600" />
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
