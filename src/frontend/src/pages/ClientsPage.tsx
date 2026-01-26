import { useState } from 'react';
import { getClients, createClient, ApiClientError } from '../services/api';
import type { Client } from '../types/api';
import { Button, Card, Input, Modal, Alert, Icon, useToast } from '../components/ui';
import { useList } from '../hooks';

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
      <Icon name="building" size="3xl" className="mx-auto text-neutral-400 mb-4" />
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
          <Icon name="warning" size="2xl" className="text-danger-500 mb-4" />
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
function ClientRow({ client }: { client: Client }) {
  return (
    <div className="p-4 hover:bg-neutral-50 transition-colors">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-neutral-900">{client.name}</h3>
          <p className="text-sm text-neutral-500">
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
  const { addToast } = useToast();
  const { items: clients, isLoading, error, refetch } = useList(getClients);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleAddClient = async (name: string) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      await createClient({ name });
      addToast(`Client "${name}" created successfully!`, 'success');
      setIsModalOpen(false);
      await refetch();
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
    <div className="min-h-screen bg-neutral-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">Clients</h1>
            <p className="text-neutral-600">Manage your client accounts.</p>
          </div>
          {!isLoading && !error && clients.length > 0 && (
            <Button intent="primary" onClick={handleOpenModal}>
              <Icon name="plus" size="md" />
              Add Client
            </Button>
          )}
        </div>

        {isLoading && <LoadingSkeleton />}

        {!isLoading && error && (
          <ErrorState message={error} onRetry={refetch} />
        )}

        {!isLoading && !error && clients.length === 0 && (
          <EmptyState onAddClick={handleOpenModal} />
        )}

        {!isLoading && !error && clients.length > 0 && (
          <Card>
            <div className="divide-y divide-neutral-200">
              {clients.map((client) => (
                <ClientRow key={client.id} client={client} />
              ))}
            </div>
          </Card>
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
