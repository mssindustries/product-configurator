# As an MSS Admin, I can create a new client

**Issue:** #76
**Domain:** backend, frontend

**Goal:** Enable MSS Admins to view all clients and create new ones with duplicate name validation.

**Architecture:**
- Backend: New `/api/v1/clients` endpoints (list, create) with Pydantic schemas
- Frontend: New `/clients` route with ClientsPage component showing list + add form
- Validation: Backend enforces unique client names, returns 409 Conflict on duplicate

---

## Task 1: Backend - Client Schemas

**Files:**
- Create: `src/backend/app/schemas/client.py`
- Modify: `src/backend/app/schemas/__init__.py`

**Steps:**
1. Create ClientBase, ClientCreate, ClientResponse schemas
2. Export from schemas __init__.py

---

## Task 2: Backend - Client API Endpoints

**Files:**
- Create: `src/backend/app/api/v1/clients.py`
- Modify: `src/backend/app/api/v1/__init__.py`
- Test: `src/backend/tests/api/test_clients.py`

**TDD Steps:**
1. Write tests for GET /api/v1/clients (empty list, with clients)
2. Write tests for POST /api/v1/clients (success, duplicate name error)
3. Run tests (expect RED)
4. Implement list_clients endpoint
5. Implement create_client endpoint with unique name check
6. Run tests (expect GREEN)
7. Register router in api/v1/__init__.py

---

## Task 3: Frontend - API Client Updates

**Files:**
- Modify: `src/frontend/src/services/api.ts`

**Steps:**
1. Add Client interface
2. Add getClients() function
3. Add createClient() function

---

## Task 4: Frontend - Clients Page

**Files:**
- Create: `src/frontend/src/pages/ClientsPage.tsx`
- Modify: `src/frontend/src/App.tsx`

**Steps:**
1. Create ClientsPage component with:
   - Client list display (name column)
   - "Add Client" button
   - Modal/form for entering client name
   - Error display for duplicate names
2. Add /clients route to App.tsx

---

## Verification

1. Backend: `cd src/backend && make test`
2. Frontend: `cd src/frontend && npm run build`
3. Manual: Start dev servers, navigate to /clients, create a client, verify duplicate error
