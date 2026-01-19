import { useState, useEffect, useCallback } from 'react';
import { getClients, createClient, ApiClientError } from '../services/api';
import type { Client } from '../types/api';

/**
 * Format a date string to a human-readable format.
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Loading skeleton for client list.
 */
function LoadingSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="divide-y divide-gray-200">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-1/4" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Empty state when no clients exist.
 */
function EmptyState({ onAddClick }: { onAddClick: () => void }) {
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
          d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
        />
      </svg>
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        No clients yet
      </h3>
      <p className="text-gray-500 mb-6">
        Get started by adding your first client.
      </p>
      <button
        onClick={onAddClick}
        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded transition"
      >
        Add Client
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
        Failed to load clients
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
 * Add Client Modal
 */
function AddClientModal({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (name: string) => void;
  isSubmitting: boolean;
  error: string | null;
}) {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSubmit(name.trim());
    }
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Client</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="client-name" className="block text-sm font-medium text-gray-700 mb-1">
              Client Name
            </label>
            <input
              id="client-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter client name"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded transition"
            >
              {isSubmitting ? 'Adding...' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/**
 * Client row component.
 */
function ClientRow({ client }: { client: Client }) {
  return (
    <div className="p-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">{client.name}</h3>
          <p className="text-sm text-gray-500">
            Created {formatDate(client.created_at)}
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * ClientsPage - View and manage clients.
 */
export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchClients = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getClients();
      setClients(response.items);
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
    fetchClients();
  }, [fetchClients]);

  const handleAddClient = async (name: string) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createClient({ name });
      setIsModalOpen(false);
      await fetchClients();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          setSubmitError('A client with this name already exists.');
        } else {
          setSubmitError(err.detail || err.message);
        }
      } else if (err instanceof Error) {
        setSubmitError(err.message);
      } else {
        setSubmitError('Failed to create client');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenModal = () => {
    setSubmitError(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSubmitError(null);
    setIsModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">Clients</h1>
            <p className="text-gray-600">Manage your client accounts.</p>
          </div>
          {!isLoading && !error && clients.length > 0 && (
            <button
              onClick={handleOpenModal}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add Client
            </button>
          )}
        </div>

        {isLoading && <LoadingSkeleton />}

        {!isLoading && error && (
          <ErrorState message={error} onRetry={fetchClients} />
        )}

        {!isLoading && !error && clients.length === 0 && (
          <EmptyState onAddClick={handleOpenModal} />
        )}

        {!isLoading && !error && clients.length > 0 && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="divide-y divide-gray-200">
              {clients.map((client) => (
                <ClientRow key={client.id} client={client} />
              ))}
            </div>
          </div>
        )}

        <AddClientModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onSubmit={handleAddClient}
          isSubmitting={isSubmitting}
          error={submitError}
        />
      </div>
    </div>
  );
}
