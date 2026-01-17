import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">MSS Industries Product Configurator</h1>
        <p className="text-gray-600 mb-6">
          Configure custom products in 3D with real-time visualization.
        </p>
        <div className="space-y-4">
          <Link
            to="/configure/cabinet"
            className="block w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded text-center transition"
          >
            Start Configuring
          </Link>
          <Link
            to="/saved"
            className="block w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded text-center transition"
          >
            View Saved Configurations
          </Link>
        </div>
      </div>
    </div>
  )
}
