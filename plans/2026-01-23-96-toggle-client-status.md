# Toggle Client Enabled/Disabled Status Implementation Plan

**Issue:** #96
**Domain:** backend, frontend

**Goal:** Allow MSS Admins to toggle a client's enabled/disabled status from the client list with immediate UI feedback.

**Architecture:** Add an `enabled` boolean field to the `Client` model (default: true). Create a new PATCH endpoint to toggle this status. Update the frontend `ClientsPage` to display status and provide a toggle switch that calls the API and updates the UI optimistically.

---

## Task 1: Backend - Add enabled field to Client model

**Files:**
- Modify: `src/backend/app/db/models/client.py`
- Modify: `src/backend/app/schemas/client.py`

**TDD Steps:**
1. Write failing tests for clients with enabled field (read)
2. Run test (expect RED)
3. Add `enabled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)` to Client model
4. Add `enabled: bool = True` to ClientBase schema
5. Run test (expect GREEN)
6. Commit

---

## Task 2: Backend - Create toggle status endpoint

**Files:**
- Modify: `src/backend/app/api/v1/routes/clients.py`
- Create: `src/backend/tests/api/test_clients.py` (add toggle tests)

**TDD Steps:**
1. Write failing test for PATCH `/api/v1/clients/{client_id}/toggle-status`
   - Test: Toggle enabled=true to false
   - Test: Toggle enabled=false to true
   - Test: 404 when client not found
2. Run test (expect RED)
3. Implement endpoint:
   - Fetch client by ID
   - Toggle `enabled` field
   - Save to database
   - Return updated `ClientResponse`
4. Run test (expect GREEN)
5. Refactor if needed
6. Commit

---

## Task 3: Frontend - Add toggle UI to ClientsPage

**Files:**
- Modify: `src/frontend/src/types/api.ts` (add enabled to Client interface)
- Modify: `src/frontend/src/services/api.ts` (add toggleClientStatus function)
- Modify: `src/frontend/src/pages/ClientsPage.tsx` (add toggle UI)

**TDD Steps:**
1. Add `enabled: boolean` to Client TypeScript interface
2. Add `toggleClientStatus(clientId: string): Promise<Client>` to API service
3. Update `ClientRow` component to display status badge and toggle switch
   - Show "Enabled" (green) or "Disabled" (gray) badge
   - Add toggle switch that calls API
   - Optimistic UI update (toggle immediately, revert on error)
4. Test manually with browser
5. Commit

---

## Task 4: Frontend - Write component tests

**Files:**
- Create: `src/frontend/src/pages/__tests__/ClientsPage.test.tsx` (or similar)

**Steps:**
1. Write tests for:
   - Status badge displays correctly based on enabled field
   - Toggle switch changes status via API call
   - Optimistic update reverts on API error
2. Run test (expect GREEN if implementation is correct)
3. Commit

---

## Verification
1. Backend tests pass: `cd src/backend && make test`
2. Frontend tests pass: `cd src/frontend && npm test`
3. Manual testing:
   - Create a client
   - Toggle status on → off (verify badge and API call)
   - Toggle status off → on (verify badge and API call)
   - Refresh page (verify status persists)
