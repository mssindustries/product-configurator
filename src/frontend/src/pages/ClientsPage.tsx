import { useState, useEffect, useCallback } from 'react';
import { getClients, createClient, toggleClientStatus, ApiClientError } from '../services/api';
import type { Client } from '../types/api';
import { Button, Card, Input, Modal, Alert } from '../components/ui';

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
    <Card>
      <div className="divide-y divide-neutral-200">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 animate-pulse">
            <div className="h-5 bg-neutral-200 rounded w-1/3 mb-2" />
            <div className="h-4 bg-neutral-200 rounded w-1/4" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Empty state when no clients exist.
 */
function EmptyState({ onAddClick }: { onAddClick: () => void }) {
  return (
    <Card padding="lg" className="text-center">
      <svg
        className="mx-auto h-16 w-16 text-neutral-400 mb-4"
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
      <h3 className="text-lg font-medium text-neutral-900 mb-2">
        No clients yet
      </h3>
      <p className="text-neutral-500 mb-6">
        Get started by adding your first client.
      </p>
      <Button intent="primary" onClick={onAddClick}>
        Add Client
      </Button>
    </Card>
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
    <div className="text-center">
      <Alert intent="danger" className="mb-6">
        <div className="flex flex-col items-center py-4">
          <svg
            className="h-12 w-12 text-danger-500 mb-4"
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
          <h3 className="text-lg font-medium mb-2">Failed to load clients</h3>
          <p className="mb-4">{message}</p>
          <Button intent="danger" onClick={onRetry}>
            Try Again
          </Button>
        </div>
      </Alert>
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

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <Modal.Header>
          <h2 className="text-xl font-semibold text-neutral-900">Add New Client</h2>
        </Modal.Header>

        <Modal.Body className="space-y-4">
          <div>
            <label
              htmlFor="client-name"
              className="block text-sm font-medium text-neutral-700 mb-1"
            >
              Client Name
            </label>
            <Input
              id="client-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter client name"
              disabled={isSubmitting}
              autoFocus
            />
          </div>

          {error && (
            <Alert intent="danger">
              <p className="text-sm">{error}</p>
            </Alert>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Button
            type="button"
            intent="secondary"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            type="submit"
            intent="primary"
            disabled={isSubmitting || !name.trim()}
            isLoading={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? 'Adding...' : 'Add Client'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

/**
 * Client row component.
 */
function ClientRow({
  client,
  onToggleStatus
}: {
  client: Client;
  onToggleStatus: (clientId: string) => void;
}) {
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      await onToggleStatus(client.id);
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="p-4 hover:bg-neutral-50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-medium text-neutral-900">{client.name}</h3>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                client.enabled
                  ? 'bg-success-100 text-success-800'
                  : 'bg-neutral-200 text-neutral-700'
              }`}
            >
              {client.enabled ? 'Enabled' : 'Disabled'}
            </span>
          </div>
          <p className="text-sm text-neutral-500">
            Created {formatDate(client.created_at)}
          </p>
        </div>
        <div className="flex items-center">
          <button
            type="button"
            onClick={handleToggle}
            disabled={isToggling}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${
              client.enabled ? 'bg-primary-600' : 'bg-neutral-200'
            } ${isToggling ? 'opacity-50 cursor-not-allowed' : ''}`}
            role="switch"
            aria-checked={client.enabled}
            aria-label={`Toggle ${client.name} status`}
          >
            <span
              aria-hidden="true"
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                client.enabled ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

type FilterOption = 'all' | 'enabled' | 'disabled';

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
  const [filter, setFilter] = useState<FilterOption>('all');

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

  const handleToggleStatus = async (clientId: string) => {
    try {
      // Optimistic update
      setClients((prevClients) =>
        prevClients.map((c) =>
          c.id === clientId ? { ...c, enabled: !c.enabled } : c
        )
      );

      // Call API
      const updatedClient = await toggleClientStatus(clientId);

      // Update with server response
      setClients((prevClients) =>
        prevClients.map((c) => (c.id === clientId ? updatedClient : c))
      );
    } catch (err) {
      // Revert on error by refetching
      await fetchClients();

      // Show error (optional - could add a toast notification)
      if (err instanceof ApiClientError) {
        console.error('Failed to toggle client status:', err.detail || err.message);
      }
    }
  };

  // Filter clients based on selected filter
  const filteredClients = clients.filter((client) => {
    if (filter === 'enabled') return client.enabled;
    if (filter === 'disabled') return !client.enabled;
    return true; // 'all'
  });

  return (
    <div className="min-h-screen bg-neutral-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Clients</h1>
            <p className="text-neutral-600">
              Manage your client accounts.
              {!isLoading && !error && clients.length > 0 && (
                <span className="text-neutral-500">
                  {' '}
                  Showing {filteredClients.length} of {clients.length} client
                  {clients.length !== 1 ? 's' : ''}
                </span>
              )}
            </p>
          </div>
          {!isLoading && !error && clients.length > 0 && (
            <Button intent="primary" onClick={handleOpenModal}>
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
            </Button>
          )}
        </div>

        {!isLoading && !error && clients.length > 0 && (
          <div className="mb-4 flex gap-2">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-300'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('enabled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'enabled'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-300'
              }`}
            >
              Enabled
            </button>
            <button
              type="button"
              onClick={() => setFilter('disabled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'disabled'
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-neutral-700 hover:bg-neutral-50 border border-neutral-300'
              }`}
            >
              Disabled
            </button>
          </div>
        )}

        {isLoading && <LoadingSkeleton />}

        {!isLoading && error && (
          <ErrorState message={error} onRetry={fetchClients} />
        )}

        {!isLoading && !error && clients.length === 0 && (
          <EmptyState onAddClick={handleOpenModal} />
        )}

        {!isLoading && !error && clients.length > 0 && (
          <>
            {filteredClients.length > 0 ? (
              <Card>
                <div className="divide-y divide-neutral-200">
                  {filteredClients.map((client) => (
                    <ClientRow key={client.id} client={client} onToggleStatus={handleToggleStatus} />
                  ))}
                </div>
              </Card>
            ) : (
              <Card padding="lg" className="text-center">
                <p className="text-neutral-500">
                  No {filter} clients found.
                </p>
              </Card>
            )}
          </>
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
