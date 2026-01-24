import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CreateProductModal } from './CreateProductModal';
import * as api from '../../services/api';
import type { Client } from '../../types/api';

// Mock the API module
vi.mock('../../services/api', () => ({
  getClients: vi.fn(),
  createProduct: vi.fn(),
  ApiClientError: class ApiClientError extends Error {
    constructor(
      message: string,
      public status: number,
      public detail?: string
    ) {
      super(message);
      this.name = 'ApiClientError';
    }
  },
}));

const mockClients: Client[] = [
  {
    id: 'client-1',
    name: 'Test Client 1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  },
  {
    id: 'client-2',
    name: 'Test Client 2',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
  },
];

describe('CreateProductModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default to successful clients fetch
    vi.mocked(api.getClients).mockResolvedValue({
      items: mockClients,
      total: mockClients.length,
    });
  });

  describe('Form Rendering', () => {
    it('renders all form fields', async () => {
      render(<CreateProductModal {...defaultProps} />);

      // Wait for clients to load
      await waitFor(() => {
        expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      });

      expect(screen.getByLabelText(/product name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/template.*path/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/configuration schema/i)).toBeInTheDocument();
    });

    it('does not render when closed', () => {
      render(<CreateProductModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Client Dropdown Loading States', () => {
    it('shows loading state while fetching clients', async () => {
      // Keep the promise pending
      let resolveClients: (value: { items: Client[]; total: number }) => void;
      vi.mocked(api.getClients).mockReturnValue(
        new Promise((resolve) => {
          resolveClients = resolve;
        })
      );

      render(<CreateProductModal {...defaultProps} />);

      expect(screen.getByText(/loading clients/i)).toBeInTheDocument();

      // Resolve to clean up
      resolveClients!({ items: mockClients, total: mockClients.length });
    });

    it('loads clients for dropdown on mount', async () => {
      render(<CreateProductModal {...defaultProps} />);

      await waitFor(() => {
        expect(api.getClients).toHaveBeenCalledTimes(1);
      });

      // Check dropdown has client options
      const select = screen.getByLabelText(/client/i);
      expect(select).toBeInTheDocument();

      // Open the select and check options
      fireEvent.click(select);
      await waitFor(() => {
        expect(screen.getByText('Test Client 1')).toBeInTheDocument();
        expect(screen.getByText('Test Client 2')).toBeInTheDocument();
      });
    });

    it('shows error if clients fail to load', async () => {
      vi.mocked(api.getClients).mockRejectedValue(new Error('Network error'));

      render(<CreateProductModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load clients/i)).toBeInTheDocument();
      });
    });

    it('shows warning if no clients exist', async () => {
      vi.mocked(api.getClients).mockResolvedValue({
        items: [],
        total: 0,
      });

      render(<CreateProductModal {...defaultProps} />);

      await waitFor(() => {
        expect(
          screen.getByText(/no clients available/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Form Validation', () => {
    it('validates required fields on submit', async () => {
      const user = userEvent.setup();
      render(<CreateProductModal {...defaultProps} />);

      // Wait for clients to load
      await waitFor(() => {
        expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      });

      // Try to submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/client is required/i)).toBeInTheDocument();
      });
    });

    it('validates JSON schema syntax', async () => {
      const user = userEvent.setup();
      render(<CreateProductModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      });

      // Enter invalid JSON
      const schemaTextarea = screen.getByLabelText(/configuration schema/i);
      await user.type(schemaTextarea, '{ invalid json }');

      // Blur to trigger validation
      fireEvent.blur(schemaTextarea);

      await waitFor(() => {
        expect(screen.getByText(/invalid json/i)).toBeInTheDocument();
      });
    });

    it('accepts valid JSON schema', async () => {
      const user = userEvent.setup();
      render(<CreateProductModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      });

      // Enter valid JSON
      const schemaTextarea = screen.getByLabelText(/configuration schema/i);
      await user.type(schemaTextarea, '{{"type": "object"}}');

      // Blur to trigger validation
      fireEvent.blur(schemaTextarea);

      // Should not show error
      await waitFor(() => {
        expect(screen.queryByText(/invalid json/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('submits product data correctly', async () => {
      const user = userEvent.setup();
      vi.mocked(api.createProduct).mockResolvedValue({
        id: 'new-product-id',
        client_id: 'client-1',
        name: 'New Product',
        description: 'A test product',
        template_blob_path: 'templates/test.blend',
        template_version: '1.0.0',
        config_schema: { type: 'object' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      render(<CreateProductModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      });

      // Fill the form
      const clientSelect = screen.getByLabelText(/client/i);
      await user.selectOptions(clientSelect, 'client-1');

      const nameInput = screen.getByLabelText(/product name/i);
      await user.type(nameInput, 'New Product');

      const descInput = screen.getByLabelText(/description/i);
      await user.type(descInput, 'A test product');

      const templateInput = screen.getByLabelText(/template.*path/i);
      await user.type(templateInput, 'templates/test.blend');

      const schemaTextarea = screen.getByLabelText(/configuration schema/i);
      await user.type(schemaTextarea, '{{"type": "object"}}');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(api.createProduct).toHaveBeenCalledWith({
          client_id: 'client-1',
          name: 'New Product',
          description: 'A test product',
          template_blob_path: 'templates/test.blend',
          config_schema: { type: 'object' },
        });
      });

      expect(defaultProps.onSuccess).toHaveBeenCalled();
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('handles optional description field', async () => {
      const user = userEvent.setup();
      vi.mocked(api.createProduct).mockResolvedValue({
        id: 'new-product-id',
        client_id: 'client-1',
        name: 'New Product',
        description: null,
        template_blob_path: 'templates/test.blend',
        template_version: '1.0.0',
        config_schema: { type: 'object' },
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      });

      render(<CreateProductModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      });

      // Fill required fields only
      await user.selectOptions(screen.getByLabelText(/client/i), 'client-1');
      await user.type(screen.getByLabelText(/product name/i), 'New Product');
      await user.type(
        screen.getByLabelText(/template.*path/i),
        'templates/test.blend'
      );
      await user.type(
        screen.getByLabelText(/configuration schema/i),
        '{{"type": "object"}}'
      );

      await user.click(screen.getByRole('button', { name: /create product/i }));

      await waitFor(() => {
        expect(api.createProduct).toHaveBeenCalledWith(
          expect.objectContaining({
            description: undefined,
          })
        );
      });
    });
  });

  describe('API Error Handling', () => {
    it('displays API error message', async () => {
      const user = userEvent.setup();
      vi.mocked(api.createProduct).mockRejectedValue(
        new api.ApiClientError('API Error', 400, 'Product name already exists')
      );

      render(<CreateProductModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      });

      // Fill valid form
      await user.selectOptions(screen.getByLabelText(/client/i), 'client-1');
      await user.type(screen.getByLabelText(/product name/i), 'Duplicate Product');
      await user.type(
        screen.getByLabelText(/template.*path/i),
        'templates/test.blend'
      );
      await user.type(
        screen.getByLabelText(/configuration schema/i),
        '{{"type": "object"}}'
      );

      await user.click(screen.getByRole('button', { name: /create product/i }));

      await waitFor(() => {
        expect(screen.getByText(/product name already exists/i)).toBeInTheDocument();
      });

      // Modal should stay open
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });

    it('handles network errors gracefully', async () => {
      const user = userEvent.setup();
      vi.mocked(api.createProduct).mockRejectedValue(new Error('Network error'));

      render(<CreateProductModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      });

      // Fill valid form
      await user.selectOptions(screen.getByLabelText(/client/i), 'client-1');
      await user.type(screen.getByLabelText(/product name/i), 'Test Product');
      await user.type(
        screen.getByLabelText(/template.*path/i),
        'templates/test.blend'
      );
      await user.type(
        screen.getByLabelText(/configuration schema/i),
        '{{"type": "object"}}'
      );

      await user.click(screen.getByRole('button', { name: /create product/i }));

      await waitFor(() => {
        expect(screen.getByText(/failed to create product/i)).toBeInTheDocument();
      });
    });
  });

  describe('Modal Behavior', () => {
    it('resets form state when closed and reopened', async () => {
      const user = userEvent.setup();
      const { rerender } = render(<CreateProductModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      });

      // Fill some fields
      await user.type(screen.getByLabelText(/product name/i), 'Test Product');

      // Close modal
      rerender(<CreateProductModal {...defaultProps} isOpen={false} />);

      // Reopen modal
      rerender(<CreateProductModal {...defaultProps} isOpen={true} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/product name/i)).toHaveValue('');
      });
    });

    it('calls onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      render(<CreateProductModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('disables submit button while submitting', async () => {
      const user = userEvent.setup();
      let resolveCreate: () => void;
      vi.mocked(api.createProduct).mockReturnValue(
        new Promise((resolve) => {
          resolveCreate = () =>
            resolve({
              id: 'new-product-id',
              client_id: 'client-1',
              name: 'Test',
              description: null,
              template_blob_path: 'test.blend',
              template_version: '1.0.0',
              config_schema: { type: 'object' },
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            });
        })
      );

      render(<CreateProductModal {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByLabelText(/client/i)).toBeInTheDocument();
      });

      // Fill valid form
      await user.selectOptions(screen.getByLabelText(/client/i), 'client-1');
      await user.type(screen.getByLabelText(/product name/i), 'Test');
      await user.type(screen.getByLabelText(/template.*path/i), 'test.blend');
      await user.type(
        screen.getByLabelText(/configuration schema/i),
        '{{"type": "object"}}'
      );

      const submitButton = screen.getByRole('button', { name: /create product/i });
      await user.click(submitButton);

      // Button should be disabled during submission
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Resolve to clean up
      resolveCreate!();
    });
  });
});
