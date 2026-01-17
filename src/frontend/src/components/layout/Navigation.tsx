import { NavLink } from 'react-router-dom'

export default function Navigation() {
  return (
    <nav className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <NavLink
              to="/"
              className={({ isActive }) =>
                `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`
              }
            >
              Home
            </NavLink>
            <NavLink
              to="/configure/cabinet"
              className={({ isActive }) =>
                `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`
              }
            >
              Configurator
            </NavLink>
            <NavLink
              to="/saved"
              className={({ isActive }) =>
                `inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive
                    ? 'border-blue-500 text-gray-900'
                    : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                }`
              }
            >
              Saved
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  )
}
