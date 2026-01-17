export default function SavedPage() {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Saved Configurations</h1>
        <p className="text-gray-600 mb-6">
          View and manage your saved product configurations.
        </p>
        <div className="bg-white p-8 rounded-lg shadow-md">
          <p className="text-gray-500">
            No saved configurations yet.
          </p>
        </div>
      </div>
    </div>
  )
}
