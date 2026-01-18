import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConfigurations, deleteConfiguration, ApiClientError } from '../services/api';
import type { Configuration } from '../types/api';

/**
 * Format a date string to a human-readable format.
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Loading skeleton for configuration cards.
 */
function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg shadow-md p-6 animate-pulse"
        >
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-2/3 mb-6" />
          <div className="flex gap-3">
            <div className="h-10 bg-gray-200 rounded flex-1" />
            <div className="h-10 bg-gray-200 rounded flex-1" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Empty state when no configurations exist.
 */
function EmptyState() {
  const navigate = useNavigate();

  return (
    <div className="bg-white p-12 rounded-lg shadow-md text-center">
      <svg
        className="mx-auto h-16 w-16 text-gray-400 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.5}
          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No saved configurations yet
      </h3>
      <p className="text-gray-500 mb-6">
        Get started by creating a new product configuration.
      </p>
      <button
        onClick={() => navigate('/configure/cabinet')}
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded transition"
      >
        Create Configuration
      </button>
    </div>
  );
}

/**
 * Error state with retry button.
 */
function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="bg-red-50 border border-red-200 p-8 rounded-lg text-center">
      <svg
        className="mx-auto h-12 w-12 text-red-400 mb-4"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
      <h3 className="text-lg font-medium text-red-800 mb-2">
        Failed to load configurations
      </h3>
      <p className="text-red-600 mb-6">{message}</p>
      <button
        onClick={onRetry}
        className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-6 rounded transition"
      >
        Try Again
      </button>
    </div>
  );
}

/**
 * Configuration card component.
 */
function ConfigurationCard({
  configuration,
  onDelete,
  isDeleting,
}: {
  configuration: Configuration;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}) {
  const navigate = useNavigate();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleView = () => {
    navigate(`/configurator/${configuration.product_id}?config=${configuration.id}`);
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    onDelete(configuration.id);
    setShowDeleteConfirm(false);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold text-gray-900 mb-2 truncate">
        {configuration.name}
      </h3>
      <p className="text-sm text-gray-500 mb-1">
        <span className="font-medium">Product ID:</span>{' '}
        <span className="font-mono text-xs">{configuration.product_id}</span>
      </p>
      <p className="text-sm text-gray-500 mb-4">
        <span className="font-medium">Created:</span>{' '}
        {formatDate(configuration.created_at)}
      </p>

      {showDeleteConfirm ? (
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-sm text-red-700 mb-3">
            Are you sure you want to delete this configuration?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-2 px-4 rounded transition text-sm"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </button>
            <button
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded transition text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex gap-3">
          <button
            onClick={handleView}
            className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-medium py-2 px-4 rounded transition"
          >
            View
          </button>
          <button
            onClick={handleDeleteClick}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded transition"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * SavedPage - View and manage saved product configurations.
 */
export default function SavedPage() {
  const [configurations, setConfigurations] = useState<Configuration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchConfigurations = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getConfigurations();
      setConfigurations(response.items);
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfigurations();
  }, [fetchConfigurations]);

  const handleDelete = async (id: string) => {
    setDeletingId(id);

    try {
      await deleteConfiguration(id);
      // Refresh the list after successful deletion
      await fetchConfigurations();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.detail || err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete configuration');
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Saved Configurations</h1>
        <p className="text-gray-600 mb-6">
          View and manage your saved product configurations.
        </p>

        {isLoading && <LoadingSkeleton />}

        {!isLoading && error && (
          <ErrorState message={error} onRetry={fetchConfigurations} />
        )}

        {!isLoading && !error && configurations.length === 0 && <EmptyState />}

        {!isLoading && !error && configurations.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {configurations.map((config) => (
              <ConfigurationCard
                key={config.id}
                configuration={config}
                onDelete={handleDelete}
                isDeleting={deletingId === config.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
