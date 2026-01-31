# Edit Client Details Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow MSS Admin to edit a client's name via a modal dialog, with changes persisted to the database.

**Architecture:** Add PATCH endpoint for clients (matching products pattern), refactor the existing AddClientModal to a unified ClientFormModal that handles both create and edit modes, and add edit icon button to ClientRow (matching ProductRow pattern).

**Tech Stack:** FastAPI, SQLAlchemy 2.0 async, Pydantic v2, React 18, TypeScript

---

## Agent Assignment

| Task | Agent | Domain |
|------|-------|--------|
| Tasks 1-3 | `fastapi-pro` | Backend (Python/FastAPI) |
| Tasks 4-7 | `typescript-pro` | Frontend (React/TypeScript) |
| Task 8 | Main agent | Manual testing & verification |

**Execution approach:** Tasks 1-3 can be done by one `fastapi-pro` agent. Tasks 4-7 can be done by one `typescript-pro` agent. These two agents can run in parallel since they work on independent codebases.

---

## Task 1: Backend - Add ClientUpdate Schema

> **Agent:** `fastapi-pro`

**Files:**
- Modify: `src/backend/app/schemas/client.py`

**Step 1: Write the failing test**

Create test in `src/backend/tests/api/test_clients.py`:

```python
async def test_update_client_success(client: AsyncClient, sample_client_data: dict):
    """Updates client name successfully."""
    # Create a client first
    create_response = await client.post("/api/v1/clients", json=sample_client_data)
    assert create_response.status_code == 201
    client_id = create_response.json()["id"]

    # Update the client
    update_data = {"name": "Updated Name"}
    response = await client.patch(f"/api/v1/clients/{client_id}", json=update_data)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["id"] == client_id
```

**Step 2: Run test to verify it fails**

Run: `cd src/backend && make test`
Expected: FAIL - 404 Not Found (endpoint doesn't exist yet)

**Step 3: Add ClientUpdate schema**

In `src/backend/app/schemas/client.py`, add after `ClientCreate`:

```python
class ClientUpdate(BaseSchema):
    """Schema for updating an existing client."""

    name: str | None = Field(default=None, min_length=1, max_length=255)
```

**Step 4: Run test to verify it still fails**

Run: `cd src/backend && make test`
Expected: FAIL - Still 404 (endpoint not yet implemented)

**Step 5: Commit**

```bash
git add src/backend/app/schemas/client.py src/backend/tests/api/test_clients.py
git commit -m "test: add update client test and ClientUpdate schema"
```

---

## Task 2: Backend - Add PATCH Endpoint

> **Agent:** `fastapi-pro`

**Files:**
- Modify: `src/backend/app/api/v1/routes/clients.py`

**Step 1: Add the PATCH endpoint**

Add to `src/backend/app/api/v1/routes/clients.py`:

```python
from uuid import UUID

# Add to imports
from app.schemas.client import ClientCreate, ClientResponse, ClientUpdate

# Add this endpoint after create_client
@router.patch("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: UUID,
    client_data: ClientUpdate,
    db: DbSession,
) -> ClientResponse:
    """
    Update an existing client.

    Only fields provided in the request body will be updated.
    Fields not included (or set to null) remain unchanged.

    Args:
        client_id: UUID of the client to update
        client_data: Partial client data to update

    Returns:
        ClientResponse with the updated client details.

    Raises:
        EntityNotFoundError: Client not found (returns 404).
        EntityAlreadyExistsError: Client with this name already exists (returns 409).
        HTTPException 422: Validation error (handled by FastAPI).
    """
    repo = ClientRepository(db)
    client = await repo.ensure_exists(client_id)

    # Get update data, excluding unset fields
    update_data = client_data.model_dump(exclude_unset=True)

    # Check for duplicate name if name is being updated
    if "name" in update_data and update_data["name"] != client.name:
        await repo.ensure_unique("name", update_data["name"], exclude_id=client_id)

    # Update only fields that are provided
    for field, value in update_data.items():
        setattr(client, field, value)

    await db.commit()
    await db.refresh(client)

    return ClientResponse.from_model(client)
```

**Step 2: Run test to verify it passes**

Run: `cd src/backend && make test`
Expected: PASS

**Step 3: Commit**

```bash
git add src/backend/app/api/v1/routes/clients.py
git commit -m "feat(backend): add PATCH endpoint for updating clients"
```

---

## Task 3: Backend - Add Edge Case Tests

> **Agent:** `fastapi-pro`

**Files:**
- Modify: `src/backend/tests/api/test_clients.py`

**Step 1: Add test for 404 on non-existent client**

```python
async def test_update_client_not_found(client: AsyncClient):
    """Returns 404 when client doesn't exist."""
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = await client.patch(f"/api/v1/clients/{fake_id}", json={"name": "New Name"})
    assert response.status_code == 404
```

**Step 2: Add test for 409 on duplicate name**

```python
async def test_update_client_duplicate_name(client: AsyncClient, sample_client_data: dict):
    """Returns 409 when updating to an existing name."""
    # Create two clients
    response1 = await client.post("/api/v1/clients", json={"name": "Client A"})
    assert response1.status_code == 201

    response2 = await client.post("/api/v1/clients", json={"name": "Client B"})
    assert response2.status_code == 201
    client_b_id = response2.json()["id"]

    # Try to update Client B to have Client A's name
    response = await client.patch(f"/api/v1/clients/{client_b_id}", json={"name": "Client A"})
    assert response.status_code == 409
    assert "already exists" in response.json()["detail"].lower()
```

**Step 3: Add test for same name (no conflict with self)**

```python
async def test_update_client_same_name_allowed(client: AsyncClient, sample_client_data: dict):
    """Allows updating with the same name (no conflict with self)."""
    # Create a client
    create_response = await client.post("/api/v1/clients", json=sample_client_data)
    assert create_response.status_code == 201
    client_id = create_response.json()["id"]

    # Update with same name should succeed
    response = await client.patch(
        f"/api/v1/clients/{client_id}",
        json={"name": sample_client_data["name"]}
    )
    assert response.status_code == 200
```

**Step 4: Run tests**

Run: `cd src/backend && make test`
Expected: PASS

**Step 5: Commit**

```bash
git add src/backend/tests/api/test_clients.py
git commit -m "test(backend): add edge case tests for client update"
```

---

## Task 4: Frontend - Add updateClient API Function

> **Agent:** `typescript-pro`

**Files:**
- Modify: `src/frontend/src/services/api.ts`
- Modify: `src/frontend/src/types/api.ts`

**Step 1: Add ClientUpdate type**

In `src/frontend/src/types/api.ts`, find the Client types section and add:

```typescript
export interface ClientUpdate {
  name?: string;
}
```

**Step 2: Add updateClient function**

In `src/frontend/src/services/api.ts`, find the Clients section and add after `createClient`:

```typescript
export async function updateClient(
  id: string,
  data: ClientUpdate
): Promise<Client> {
  return fetchApi<Client>(`/api/v1/clients/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}
```

**Step 3: Verify TypeScript compiles**

Run: `cd src/frontend && npm run build`
Expected: Build succeeds

**Step 4: Commit**

```bash
git add src/frontend/src/services/api.ts src/frontend/src/types/api.ts
git commit -m "feat(frontend): add updateClient API function"
```

---

## Task 5: Frontend - Create ClientFormModal Component

> **Agent:** `typescript-pro`

**Files:**
- Modify: `src/frontend/src/pages/ClientsPage.tsx`

**Step 1: Refactor AddClientModal to ClientFormModal**

Replace the `AddClientModal` component with `ClientFormModal` that handles both create and edit modes:

```tsx
/**
 * Client Form Modal - handles both create and edit modes.
 */
function ClientFormModal({
  isOpen,
  onClose,
  onSuccess,
  client,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  client?: Client;
}) {
  const isEditMode = !!client;
  const { addToast } = useToast();
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes or client changes
  useEffect(() => {
    if (isOpen) {
      setName(client?.name ?? '');
      setError(null);
    }
  }, [isOpen, client]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) return;

    setIsSubmitting(true);
    setError(null);

    try {
      if (isEditMode && client) {
        await updateClient(client.id, { name: trimmedName });
        addToast(`Client "${trimmedName}" updated successfully!`, 'success');
      } else {
        await createClient({ name: trimmedName });
        addToast(`Client "${trimmedName}" created successfully!`, 'success');
      }
      onSuccess();
      onClose();
    } catch (err) {
      if (err instanceof ApiClientError) {
        if (err.status === 409) {
          setError('A client with this name already exists.');
        } else {
          setError(err.detail || err.message);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(isEditMode ? 'Failed to update client' : 'Failed to create client');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setName('');
      setError(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <form onSubmit={handleSubmit}>
        <Modal.Header>
          <h2 className="text-xl font-semibold text-neutral-900">
            {isEditMode ? 'Edit Client' : 'Add New Client'}
          </h2>
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
            {isSubmitting
              ? isEditMode ? 'Updating...' : 'Adding...'
              : isEditMode ? 'Update Client' : 'Add Client'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
```

**Step 2: Add updateClient to imports**

Update the imports at the top of `ClientsPage.tsx`:

```typescript
import { getClients, createClient, updateClient, ApiClientError } from '../services/api';
```

**Step 3: Add useEffect import**

Ensure `useEffect` is imported:

```typescript
import { useState, useEffect } from 'react';
```

**Step 4: Verify TypeScript compiles**

Run: `cd src/frontend && npm run build`
Expected: Build succeeds (note: ClientsPage won't fully work yet until we wire up the edit functionality)

**Step 5: Commit**

```bash
git add src/frontend/src/pages/ClientsPage.tsx
git commit -m "refactor(frontend): convert AddClientModal to ClientFormModal with edit support"
```

---

## Task 6: Frontend - Add Edit Icon to ClientRow

> **Agent:** `typescript-pro`

**Files:**
- Modify: `src/frontend/src/pages/ClientsPage.tsx`

**Step 1: Update ClientRow to accept onEdit prop**

Replace the `ClientRow` component:

```tsx
/**
 * Client row component with edit button.
 */
function ClientRow({
  client,
  onEdit,
}: {
  client: Client;
  onEdit: (client: Client) => void;
}) {
  return (
    <div className="p-4 hover:bg-neutral-50 transition-colors">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-medium text-neutral-900 truncate">
            {client.name}
          </h3>
          <p className="text-sm text-neutral-500">
            Created {formatDate(client.created_at)}
          </p>
        </div>
        <div className="flex-shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onEdit(client)}
            className="p-1.5 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            aria-label={`Edit ${client.name}`}
          >
            <Icon name="edit" size="md" />
          </button>
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `cd src/frontend && npm run build`
Expected: Build fails - ClientRow usage needs to be updated

**Step 3: Commit (partial - will complete in next task)**

Do not commit yet - continue to Task 7.

---

## Task 7: Frontend - Wire Up Edit Functionality in ClientsPage

> **Agent:** `typescript-pro`

**Files:**
- Modify: `src/frontend/src/pages/ClientsPage.tsx`

**Step 1: Add selectedClient state and handlers**

In the `ClientsPage` component, update the state and handlers:

```tsx
export default function ClientsPage() {
  const { addToast } = useToast();
  const { items: clients, isLoading, error, refetch } = useList(getClients);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | undefined>(undefined);

  const handleAddClient = () => {
    setSelectedClient(undefined);
    setIsModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(undefined);
  };

  const handleClientSaved = () => {
    refetch();
  };

  // ... rest of component
```

**Step 2: Update ClientRow usage in the render**

Replace the clients map:

```tsx
{clients.map((client) => (
  <ClientRow
    key={client.id}
    client={client}
    onEdit={handleEditClient}
  />
))}
```

**Step 3: Update modal usage**

Replace the `AddClientModal` usage with:

```tsx
<ClientFormModal
  isOpen={isModalOpen}
  onClose={handleCloseModal}
  onSuccess={handleClientSaved}
  client={selectedClient}
/>
```

**Step 4: Update button onClick handlers**

Update both "Add Client" buttons to use `handleAddClient`:

```tsx
<Button intent="primary" onClick={handleAddClient}>
```

**Step 5: Remove old state and handlers**

Remove these that are no longer needed:
- `isSubmitting` state
- `submitError` state
- `handleAddClient` (old version that took a name parameter)
- `handleOpenModal`
- `handleCloseModal` (old version)

**Step 6: Verify TypeScript compiles and lint passes**

Run: `cd src/frontend && npm run build && npm run lint`
Expected: Both pass

**Step 7: Commit**

```bash
git add src/frontend/src/pages/ClientsPage.tsx
git commit -m "feat(frontend): add edit client functionality with modal and edit icon"
```

---

## Task 8: Automated Verification

> **Agent:** Main agent

**Step 1: Run backend tests**

```bash
cd src/backend && make check
```

Expected: All tests pass including new update client tests

**Step 2: Run frontend build and lint**

```bash
cd src/frontend && npm run build && npm run lint
```

Expected: Build succeeds, no lint errors

**Step 3: Verify all commits are in place**

```bash
git log --oneline -10
```

Expected: See commits for:
- Backend schema and test
- Backend PATCH endpoint
- Backend edge case tests
- Frontend API function
- Frontend modal and edit functionality

---

## Verification Checklist

- [ ] Backend PATCH endpoint returns 200 with updated client
- [ ] Backend returns 404 for non-existent client
- [ ] Backend returns 409 for duplicate name
- [ ] Backend allows updating with same name (no self-conflict)
- [ ] Frontend edit icon appears on each client row
- [ ] Frontend modal shows "Edit Client" in edit mode
- [ ] Frontend modal pre-fills current client name
- [ ] Frontend shows success toast after update
- [ ] Frontend shows error for duplicate name
- [ ] All backend tests pass (`make test`)
- [ ] Frontend builds without errors (`npm run build`)
- [ ] Frontend lints without errors (`npm run lint`)
