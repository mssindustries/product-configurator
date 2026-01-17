import { useParams } from 'react-router-dom'

export default function ConfiguratorPage() {
  const { productId } = useParams<{ productId: string }>()

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Product Configurator</h1>
        <p className="text-gray-600 mb-6">
          Configuring: <span className="font-semibold">{productId}</span>
        </p>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-500">
            3D configurator will be rendered here using React Three Fiber.
          </p>
        </div>
      </div>
    </div>
  )
}
