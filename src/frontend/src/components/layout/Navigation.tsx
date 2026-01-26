import { Link } from 'react-router-dom'
import { RoleSwitcher } from './RoleSwitcher'
import { useAuth } from '@/hooks/useAuth'
import { Icon } from '@/components/ui'

export default function Navigation() {
  const { isAdmin } = useAuth()

  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-gray-900">MSS Industries</span>
            <Link
              to="/"
              className="flex items-center gap-2 ml-6 text-neutral-600 hover:text-neutral-900 transition-colors"
            >
              <Icon name="home" size="md" />
              <span className="text-sm font-medium">Home</span>
            </Link>
            {isAdmin && (
              <>
                <Link
                  to="/clients"
                  className="flex items-center gap-2 ml-6 text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  <Icon name="building" size="md" />
                  <span className="text-sm font-medium">Clients</span>
                </Link>
                <Link
                  to="/products"
                  className="flex items-center gap-2 ml-6 text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  <Icon name="cube" size="md" />
                  <span className="text-sm font-medium">Products</span>
                </Link>
              </>
            )}
          </div>
          <RoleSwitcher />
        </div>
      </div>
    </nav>
  )
}
