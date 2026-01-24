# As an MSS Admin, I can create a product for a client - Implementation Plan

**Issue:** #80
**Domain:** backend, frontend
**Created:** 2026-01-23

**Goal:** Enable MSS Admins to create products via a new Products management page with Blender template upload and JSON schema configuration.

**Architecture Overview:**

This implementation adds a complete product creation workflow in two phases:

**Phase 1: Basic Product CRUD**
1. **Backend**: Use the existing `POST /api/v1/products` endpoint with basic JSON payload. Template path will be a text input temporarily.
2. **Frontend**: Create new `/products` page with list view and creation modal (similar to `/clients` page).
3. Get the core product management working with all text-based fields.

**Phase 2: File Upload Integration**
1. **Backend**: Add Azure Blob Storage service and update API to accept multipart/form-data for .blend file upload.
2. **Frontend**: Replace template path text input with file upload component.
3. **Data Flow**: User uploads file → Backend stores in Azure Blob → Product record gets blob path.

**Key Design Decisions:**
- Blender template: Upload via file input, store in Azure Blob Storage (Phase 2)
- Config schema: Manual JSON entry via textarea with validation
- Template version: Auto-default to "1.0.0" (future enhancement in #143)
- UI: New `/products` page (filtering by client in future #142)

---

## Task 1: Backend - Validate Existing Product API

**Files:**
- Review: `src/backend/app/api/v1/routes/products.py`
- Review: `src/backend/app/schemas/product.py`
- Modify: `src/backend/app/schemas/product.py` (add JSON Schema validator)
- Modify: `src/backend/tests/api/test_products.py` ⚠️ **Note:** Path is `tests/api/` not `tests/test_api/`

**TDD Steps:**

### 1.1: Verify existing test coverage

1. Review existing test `test_create_product_success()` in `tests/api/test_products.py` (lines 75-86)
   - Confirms endpoint accepts JSON payload
   - Confirms 201 response with all fields
2. Add assertion for `template_version` default if missing:
   ```python
   assert response_data["template_version"] == "1.0.0"
   ```
3. Run test (expect GREEN - should already pass)
4. Commit: "test(backend): Verify product creation API coverage"

### 1.2: Add JSON Schema validation for config_schema

**Context:** The `config_schema` field is typed as `dict[str, Any]`, not `str`. Pydantic already validates JSON structure. We need to validate that it's a valid **JSON Schema**, not just any JSON object.

1. Add `jsonschema` to imports in `product.py` (already in dependencies)
2. Write test: `test_create_product_invalid_json_schema()`
   - Send request where `config_schema` is `{}` (missing "type" at root)
   - Assert 422 with error about invalid JSON Schema
3. Run test (expect RED)
4. Add Pydantic field validator to `ProductCreate` schema:
   ```python
   from jsonschema import Draft7Validator, SchemaError
   from pydantic import field_validator

   @field_validator("config_schema")
   @classmethod
   def validate_json_schema(cls, v: dict[str, Any]) -> dict[str, Any]:
       try:
           Draft7Validator.check_schema(v)
       except SchemaError as e:
           raise ValueError(f"Invalid JSON Schema: {e.message}")
       return v
   ```
5. Run test (expect GREEN)
6. Commit: "feat(backend): Validate config_schema is valid JSON Schema"

### 1.3: Test template_version defaults correctly

1. Verify existing model default in `product.py` line 45: `default="1.0.0"`
2. Test should pass immediately (GREEN) - model already implements this
3. If test doesn't exist, add: `test_create_product_defaults_template_version()`
4. Commit: "test(backend): Verify template_version defaults"

### 1.4: Add client foreign key constraint test (note for future)

**Note:** This test will expose that test clients use random UUIDs. On PostgreSQL with FK constraints, this would fail. For now, document as a known limitation.

1. Add comment in tests noting FK constraint is not enforced in test SQLite
2. Future: Create valid client first, then use its ID for product creation

---

## Task 2: Frontend - Products Page (List View)

**Files:**
- Create: `src/frontend/src/pages/ProductsPage.tsx`
- Create: `src/frontend/src/pages/ProductsPage.test.tsx`
- Modify: `src/frontend/src/App.tsx` (add route)
- Modify: `src/frontend/src/components/layout/Navigation.tsx` (add link)
- Consider: Extract shared components (LoadingSkeleton, EmptyState, ErrorState) to `components/common/` (currently duplicated in ClientsPage)

**TDD Steps:**

### 2.1: Create ProductsPage with list view

1. Write failing tests: `ProductsPage.test.tsx`
   ```typescript
   describe('ProductsPage', () => {
     it('renders loading skeleton while fetching', () => { ... });
     it('renders products in a list after fetch', () => { ... });
     it('displays client name for each product', () => { ... });
     it('renders empty state when no products exist', () => { ... });
     it('renders error state on API failure', () => { ... });
   });
   ```
2. Run test (expect RED)
3. Implement `ProductsPage` component:
   - Fetch products via `getProducts()`
   - Fetch clients via `getClients()` to resolve client names
   - Create client lookup: `Map<string, Client>` for O(1) name resolution
   - Display in table/list format: product name, client name (from lookup), created date
   - Loading, empty, and error states (match ClientsPage pattern)
   - Handle case where client is deleted: show `client_id` or "Unknown Client"
4. Run test (expect GREEN)
5. Refactor: Consider extracting product list item to component if needed
6. Commit: "feat(frontend): Add Products page with list view"

**Client Name Resolution Strategy:**
```typescript
const [products, setProducts] = useState<Product[]>([]);
const [clients, setClients] = useState<Client[]>([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
  Promise.all([getProducts(), getClients()])
    .then(([productsRes, clientsRes]) => {
      setProducts(productsRes.items);
      setClients(clientsRes.items);
    });
}, []);

// Create lookup map
const clientsMap = new Map(clients.map(c => [c.id, c]));

// In render:
{products.map(product => (
  <div key={product.id}>
    {product.name} - {clientsMap.get(product.client_id)?.name ?? 'Unknown Client'}
  </div>
))}
```

**Future Optimization:** Add `client_name` to backend `ProductResponse` (requires SQL join), but not blocking for Phase 1.

### 2.2: Add navigation link

1. Update `Navigation.tsx` to add "Products" link (admin role only)
2. Add route in `App.tsx`: `/products` → `<ProductsPage />`
3. Manual verification: Navigate to /products, see empty list
4. Commit: "feat(frontend): Add Products navigation"

### 2.3: (Optional) Extract shared UI components

**Rationale:** LoadingSkeleton, EmptyState, and ErrorState are duplicated from ClientsPage.

1. Create `src/frontend/src/components/common/LoadingSkeleton.tsx`
2. Create `src/frontend/src/components/common/EmptyState.tsx`
3. Create `src/frontend/src/components/common/ErrorState.tsx`
4. Refactor both ClientsPage and ProductsPage to use shared components
5. Commit: "refactor(frontend): Extract shared page state components"

**Decision:** Can defer this to avoid scope creep, but document for future refactor.

---

## Task 3: Frontend - Product Creation Modal (Basic Fields)

**Files:**
- Create: `src/frontend/src/components/products/CreateProductModal.tsx`
- Create: `src/frontend/src/components/products/CreateProductModal.test.tsx`
- Create: `src/frontend/src/components/ui/Textarea.tsx` (if Input doesn't support multiline)
- Create: `src/frontend/src/components/ui/Select.tsx` (for client dropdown)
- Modify: `src/frontend/src/pages/ProductsPage.tsx`

**Form State Management Approach:**

Given the complexity (5+ fields, JSON validation, file upload in Phase 2), use a form state object:

```typescript
interface ProductFormData {
  clientId: string;
  name: string;
  description: string;
  templateBlobPath: string;  // Phase 1: text input, Phase 2: File
  configSchema: string;       // Raw JSON string for validation
}

const [formData, setFormData] = useState<ProductFormData>({
  clientId: '',
  name: '',
  description: '',
  templateBlobPath: '',
  configSchema: '',
});
```

**Alternative:** React Hook Form for built-in validation, but adds dependency. Document as optional enhancement.

**TDD Steps:**

### 3.1: Build CreateProductModal form (without file upload)

1. Write failing tests: `CreateProductModal.test.tsx`
   ```typescript
   describe('CreateProductModal', () => {
     it('renders all form fields', () => { ... });
     it('loads clients for dropdown on mount', () => { ... });
     it('shows loading state while fetching clients', () => { ... });
     it('shows error if clients fail to load', () => { ... });
     it('shows warning if no clients exist', () => { ... });
     it('validates required fields on submit', () => { ... });
   });
   ```
2. Run test (expect RED)
3. Implement modal component with fields:
   - **Client dropdown** (Select component):
     - Fetch from `getClients()` on modal open
     - Loading state: `<Select disabled placeholder="Loading clients..." />`
     - Error state: `<Alert intent="danger">Failed to load clients</Alert>`
     - Empty state: `<Alert intent="warning">No clients available. Create a client first.</Alert>`
     - Options: `clients.map(c => ({ value: c.id, label: c.name }))`
   - **Product name** input (required, max 255 chars)
   - **Description** textarea (optional, max 5000 chars)
   - **Template blob path** input (text input, required, max 500 chars) - *temporary*
   - **Config schema** textarea (JSON, required)
4. Add form validation (required fields, max lengths)
5. Run test (expect GREEN)
6. Commit: "feat(frontend): Build product creation form"

**UI Component Notes:**
- **Textarea:** Check if existing `Input` component supports `multiline` prop. If not, create `Textarea.tsx` using CVA pattern from `Input.tsx`.
- **Select:** Create `Select.tsx` following CVA pattern. Reference: Radix UI or Headless UI for accessibility, or use native `<select>` with Tailwind styling.

### 3.2: Add JSON schema validation

1. Write test: `test_validates_json_schema_syntax()`
   - Enter invalid JSON in config schema
   - Assert error message shown: "Invalid JSON: Unexpected token..."
2. Run test (expect RED)
3. Implement JSON validation utility:
   ```typescript
   function validateJsonSchema(value: string): { valid: boolean; error?: string } {
     try {
       JSON.parse(value);
       return { valid: true };
     } catch (err) {
       return {
         valid: false,
         error: `Invalid JSON: ${err instanceof Error ? err.message : 'Unknown error'}`
       };
     }
   }
   ```
4. Add validation on blur/submit for config schema textarea
5. Show error message below field
6. Run test (expect GREEN)
7. Commit: "feat(frontend): Validate config schema JSON syntax"

**Future Enhancement:** JSON editor with syntax highlighting (Monaco, CodeMirror), but not blocking for MVP.

### 3.3: Implement form submission

1. Write test: `test_submits_product_data()`
   - Mock `createProduct` API call
   - Submit form with valid data
   - Assert API called with correct payload (config_schema as parsed JSON object)
2. Run test (expect RED)
3. Hook up form submit handler:
   - Parse `configSchema` string to object
   - Call `createProduct({ ...formData, config_schema: JSON.parse(formData.configSchema) })`
   - Handle success: close modal, show success toast, refresh list
4. Run test (expect GREEN)
5. Commit: "feat(frontend): Implement product creation submission"

### 3.4: Handle API errors

1. Write test: `test_displays_api_error()`
   - Mock 400 error from API
   - Assert error message shown from `error.detail`
2. Run test (expect RED)
3. Add error handling in form submit:
   - Catch `ApiClientError`
   - Display `error.detail` in Alert component
4. Run test (expect GREEN)
5. Commit: "feat(frontend): Handle product creation errors"

---

## Task 4: Frontend Styling & Polish

**Files:**
- Create: `src/frontend/src/components/ui/FormField.tsx` (reusable wrapper)
- Modify: `src/frontend/src/pages/ProductsPage.tsx`
- Modify: `src/frontend/src/components/products/CreateProductModal.tsx`

**Steps:**

### 4.1: Create FormField wrapper component

Extract the label + error pattern repeated across forms:

```typescript
// src/frontend/src/components/ui/FormField.tsx
interface FormFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  children: ReactNode;
}

export function FormField({ label, required, error, children }: FormFieldProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        {label}{required && <span className="text-danger-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
    </div>
  );
}
```

Commit: "feat(frontend): Add FormField wrapper component"

### 4.2: Apply responsive layout to modal

**Modal layout considerations:**
- Two-column grid for compact fields (client, name) on wider screens
- Full-width for textareas (description, config schema)
- Max height with scroll for long config schemas
- Proper field grouping (basic info vs. technical fields)

```typescript
<Modal.Body className="space-y-4 max-h-[60vh] overflow-y-auto">
  {/* Basic Info - two columns on md+ */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <FormField label="Client" required>
      <Select ... />
    </FormField>
    <FormField label="Product Name" required>
      <Input ... />
    </FormField>
  </div>

  {/* Description - full width */}
  <FormField label="Description">
    <Textarea rows={3} ... />
  </FormField>

  {/* Technical Fields - full width */}
  <FormField label="Template Path" required>
    <Input ... />
  </FormField>
  <FormField label="Configuration Schema (JSON)" required>
    <Textarea rows={8} placeholder='{"type": "object", "properties": {...}}' ... />
  </FormField>
</Modal.Body>
```

Commit: "style(frontend): Add responsive layout to product modal"

### 4.3: Polish ProductsPage UI

1. Review existing UI components in `src/frontend/src/components/ui/`
2. Apply design tokens from `index.css`:
   - Primary colors: `primary-500`, `primary-600`
   - Neutral colors: `neutral-100`, `neutral-700`
   - Status colors: `success-500`, `danger-500`, `warning-500`
3. Match styling to existing `ClientsPage.tsx` pattern:
   - Card layout for content
   - Button styles
   - Table/list styling
   - Alert components for errors
4. Add loading skeletons (match ClientsPage pattern)
5. Add empty state with helpful message: "No products yet. Create your first product to get started."
6. Add error state with retry button
7. Ensure responsive layout (mobile-friendly)
8. Commit: "style(frontend): Polish Products page UI"

### 4.4: UX Enhancements

**Success Feedback:**
Add toast notification on successful product creation (not just closing modal):
```typescript
// After successful creation
toast.success('Product created successfully!');
```

**Keyboard Accessibility:**
- Modal closes on Escape key
- Tab navigation through form fields
- Enter key submits form (if validation passes)

Commit: "feat(frontend): Add UX enhancements to product creation"

---

## Task 5: Basic Integration Testing

**Files:**
- Create: `src/backend/tests/integration/test_product_creation_flow.py` ⚠️ **Note:** Path is `tests/integration/` not `tests/test_integration/`

**TDD Steps:**

### 5.1: End-to-end product creation test (without file upload)

1. Write test: `test_create_product_basic_flow()`
   - **Important:** Create a valid client first (FK constraint):
     ```python
     # Create client for FK relationship
     client = Client(name="Test Client")
     db_session.add(client)
     await db_session.commit()

     # Create product with valid client_id
     product_data = {
         "client_id": str(client.id),
         "name": "Test Product",
         "description": "Test description",
         "template_blob_path": "templates/test.blend",
         "config_schema": {"type": "object", "properties": {}},
     }
     response = await client.post("/api/v1/products", json=product_data)
     ```
   - Assert 201 response
   - Assert Product created in DB
   - Assert all fields stored correctly (including text template_blob_path)
   - Assert template_version defaults to "1.0.0"
2. Run test (expect RED)
3. Ensure all components work together
4. Run test (expect GREEN)
5. Commit: "test(backend): Add basic product creation integration test"

**Note on Foreign Key Constraints:**
- SQLite (used in tests) may not enforce FK constraints by default
- On PostgreSQL (production), invalid `client_id` will return 400/422 error
- Tests should use valid client IDs to match production behavior

---

## 🔄 PHASE 2: File Upload Integration

## Task 6: Backend - Azure Blob Storage Service

**Files:**
- Modify: `src/backend/pyproject.toml` (add azure-storage-blob dependency)
- Create: `src/backend/app/services/__init__.py`
- Create: `src/backend/app/services/blob_storage.py`
- Modify: `src/backend/app/api/deps.py` (add BlobStorage dependency)
- Create: `src/backend/tests/services/__init__.py`
- Create: `src/backend/tests/services/test_blob_storage.py`
- Modify: `src/backend/app/core/config.py` (add container name config)

**TDD Steps:**

### 6.1: Add dependencies and configuration

1. Add to `pyproject.toml` dependencies:
   ```toml
   "azure-storage-blob>=12.19.0",
   ```
2. Run: `uv pip install azure-storage-blob`
3. Review existing config in `config.py` (line 32-35):
   ```python
   azure_storage_connection_string: str = Field(
       default="UseDevelopmentStorage=true",
       description="Azure Blob Storage connection string",
   )
   ```
   **Note:** Connection string already exists! Only need to add container name.
4. Write test for container name config
5. Run test (expect RED)
6. Add container name to `config.py`:
   ```python
   azure_storage_container_name: str = Field(
       default="product-templates",
       description="Azure Blob Storage container for product templates",
   )
   ```
7. Run test (expect GREEN)
8. Commit: "feat(backend): Add Azure Blob container config and dependency"

### 6.2: Implement async blob upload service

**Design:** Service should be async and generic (no file validation - that's API layer responsibility).

1. Create `services/__init__.py`
2. Write failing test: `test_upload_blob_returns_path()` in `test_blob_storage.py`
   - Use `pytest-mock` to mock `BlobServiceClient`
   - Assert returns blob path in format: `product-templates/{uuid}/{filename}`
3. Run test (expect RED)
4. Implement async `BlobStorageService`:
   ```python
   import uuid
   from azure.storage.blob.aio import BlobServiceClient
   from azure.core.exceptions import ResourceNotFoundError, ClientAuthenticationError

   class BlobStorageService:
       def __init__(self, connection_string: str, container_name: str):
           self._connection_string = connection_string
           self._container_name = container_name

       async def upload_template(
           self,
           file_data: bytes,
           filename: str,
       ) -> str:
           """Upload template file and return blob path."""
           blob_name = f"{uuid.uuid4()}/{filename}"

           async with BlobServiceClient.from_connection_string(
               self._connection_string
           ) as client:
               container = client.get_container_client(self._container_name)
               await container.upload_blob(blob_name, file_data, overwrite=True)

           return f"{self._container_name}/{blob_name}"
   ```
5. Run test (expect GREEN)
6. Commit: "feat(backend): Add async blob upload service"

### 6.3: Add error handling for blob upload failures

1. Write tests:
   - `test_upload_blob_handles_network_error()`
   - `test_upload_blob_handles_auth_error()`
2. Run tests (expect RED)
3. Add error handling:
   ```python
   from azure.core.exceptions import (
       ResourceNotFoundError,
       ClientAuthenticationError,
       HttpResponseError,
   )

   async def upload_template(self, file_data: bytes, filename: str) -> str:
       try:
           # ... existing upload code
       except ClientAuthenticationError as e:
           raise ValueError(f"Azure authentication failed: {e}") from e
       except HttpResponseError as e:
           raise ValueError(f"Blob upload failed: {e}") from e
   ```
4. Run tests (expect GREEN)
5. Commit: "feat(backend): Add blob upload error handling"

### 6.4: Add dependency injection

1. Create `BlobStorage` dependency in `deps.py`:
   ```python
   from typing import Annotated
   from fastapi import Depends
   from app.services.blob_storage import BlobStorageService
   from app.core.config import settings

   def get_blob_storage() -> BlobStorageService:
       return BlobStorageService(
           settings.azure_storage_connection_string,
           settings.azure_storage_container_name,
       )

   BlobStorage = Annotated[BlobStorageService, Depends(get_blob_storage)]
   ```
2. Write test verifying dependency returns service instance
3. Commit: "feat(backend): Add BlobStorage dependency injection"

**Note:** File validation (.blend extension, magic bytes) will be in Task 7 (API layer), not in the service.

---

## Task 7: Backend - Create File Upload Endpoint

**Files:**
- Modify: `src/backend/app/core/config.py` (add MAX_TEMPLATE_FILE_SIZE)
- Modify: `src/backend/app/api/v1/routes/products.py` (add /upload endpoint)
- Modify: `src/backend/tests/api/test_products.py` ⚠️ **Note:** Path is `tests/api/` not `tests/test_api/`

**Design Decision:** Create separate `/api/v1/products/upload` endpoint for multipart uploads instead of mixing JSON and multipart in the same endpoint. This provides cleaner API design and avoids FastAPI content-type conflicts.

**TDD Steps:**

### 7.1: Add file size configuration

1. Add to `config.py`:
   ```python
   max_template_file_size: int = Field(
       default=52_428_800,  # 50MB in bytes
       description="Maximum template file size in bytes",
   )
   ```
2. Commit: "feat(backend): Add max template file size config"

### 7.2: Create POST /api/v1/products/upload endpoint

1. Write failing test: `test_create_product_with_file_upload()`
   - Create multipart request:
     ```python
     files = {"file": ("test.blend", b"BLENDER...", "application/octet-stream")}
     data = {
         "client_id": str(client.id),
         "name": "Test Product",
         "description": "Test description",
         "config_schema": json.dumps({"type": "object"}),
         "template_version": "1.0.0",
     }
     response = await client.post("/api/v1/products/upload", files=files, data=data)
     ```
   - Assert 201 response
   - Assert product created with blob path from Azure
2. Run test (expect RED)
3. Implement new endpoint in `products.py`:
   ```python
   @router.post("/upload", response_model=ProductResponse, status_code=201)
   async def create_product_with_upload(
       db: DbSession,
       blob_storage: BlobStorage,
       file: UploadFile = File(...),
       client_id: str = Form(...),
       name: str = Form(..., max_length=255),
       description: str | None = Form(default=None, max_length=5000),
       config_schema: str = Form(...),  # JSON string - will be parsed
       template_version: str = Form(default="1.0.0", max_length=50),
   ) -> ProductResponse:
       # Validation logic (see next steps)
       ...
   ```
4. Run test (expect GREEN)
5. Commit: "feat(backend): Add /upload endpoint for product creation"

### 7.3: Add file validation (extension, magic bytes, size)

1. Write failing tests:
   - `test_upload_validates_file_extension()` - non-.blend file → 422
   - `test_upload_validates_blend_magic_bytes()` - .blend file without BLENDER header → 422
   - `test_upload_validates_file_size()` - file > 50MB → 422
2. Run tests (expect RED)
3. Implement validation in endpoint:
   ```python
   import re
   from app.core.config import settings

   # Validate file extension
   if not file.filename or not file.filename.lower().endswith(".blend"):
       raise HTTPException(422, "File must have .blend extension")

   # Read file data
   file_data = await file.read()

   # Validate file size
   if len(file_data) > settings.max_template_file_size:
       size_mb = settings.max_template_file_size / 1_048_576
       raise HTTPException(422, f"File size exceeds {size_mb}MB limit")

   # Validate Blender magic bytes
   BLEND_MAGIC = b"BLENDER"
   if not file_data.startswith(BLEND_MAGIC):
       raise HTTPException(422, "Invalid Blender file format")

   # Sanitize filename for blob storage (prevent path traversal)
   safe_filename = re.sub(r'[^a-zA-Z0-9._-]', '_', file.filename)
   ```
4. Run tests (expect GREEN)
5. Commit: "feat(backend): Add file validation for uploads"

### 7.4: Parse and validate config_schema JSON

1. Write test: `test_upload_validates_config_schema_json()`
   - Send invalid JSON string for config_schema
   - Assert 422 error
2. Run test (expect RED)
3. Implement JSON parsing:
   ```python
   try:
       schema_dict = json.loads(config_schema)
   except json.JSONDecodeError as e:
       raise HTTPException(422, f"config_schema must be valid JSON: {e}")

   # Validate it's a valid JSON Schema (if Task 1.2 implemented)
   from jsonschema import Draft7Validator, SchemaError
   try:
       Draft7Validator.check_schema(schema_dict)
   except SchemaError as e:
       raise HTTPException(422, f"Invalid JSON Schema: {e.message}")
   ```
4. Run test (expect GREEN)
5. Commit: "feat(backend): Validate config_schema JSON in upload"

### 7.5: Implement blob upload with transaction safety

**Critical:** If blob upload succeeds but DB commit fails, we have an orphaned blob. Implement cleanup.

1. Write test: `test_upload_rollback_on_db_failure()`
   - Mock DB commit to raise exception
   - Assert blob upload is attempted but product not created
   - **Note:** Full cleanup test requires mocking blob delete (complex)
2. Run test (expect RED)
3. Implement upload + product creation with error handling:
   ```python
   # Upload to blob storage
   blob_path = await blob_storage.upload_template(file_data, safe_filename)

   # Create product record
   product = Product(
       client_id=client_id,
       name=name,
       description=description,
       template_blob_path=blob_path,
       template_version=template_version,
       config_schema=schema_dict,
   )

   try:
       db.add(product)
       await db.commit()
       await db.refresh(product)
   except Exception as e:
       # TODO: Delete uploaded blob on failure (future enhancement)
       # await blob_storage.delete_template(blob_path)
       raise HTTPException(500, f"Failed to create product: {e}") from e

   return ProductResponse.model_validate(product)
   ```
4. Run test (expect GREEN)
5. **Document cleanup as future enhancement** (requires `delete_template` method in BlobStorageService)
6. Commit: "feat(backend): Implement product creation with blob upload"

### 7.6: Update OpenAPI schema annotations

1. Verify OpenAPI docs at `/docs` show:
   - `/upload` endpoint with file upload parameter
   - Form fields documented correctly
   - Content-Type: multipart/form-data
2. Add docstring to endpoint if needed for better docs
3. Commit: "docs(backend): Update OpenAPI for product upload endpoint"

**Future Enhancement (out of scope for this issue):**
- Implement `BlobStorageService.delete_template()` for cleanup
- Add retry logic for transient Azure errors
- Add blob path to response for client-side verification

---

## Task 8: Frontend - Replace Text Input with File Upload

**Files:**
- Create: `src/frontend/src/components/ui/FileUpload.tsx` (optional, for better UX)
- Modify: `src/frontend/src/components/products/CreateProductModal.tsx`
- Modify: `src/frontend/src/components/products/CreateProductModal.test.tsx`
- Modify: `src/frontend/src/services/api.ts`

**Critical Note:** The current `fetchApi` function in `api.ts` always sets `Content-Type: application/json`, which breaks FormData uploads. FormData requires the browser to set Content-Type with the boundary parameter.

**TDD Steps:**

### 8.1: Update API client for multipart (using fetch directly)

1. Write failing test: `test_createProductWithFile_sends_multipart()`
   - Mock global `fetch`
   - Assert FormData constructed correctly
   - Assert Content-Type is NOT set (browser sets it automatically)
2. Run test (expect RED)
3. Add new function to `api.ts` for file upload:
   ```typescript
   export async function createProductWithFile(
     data: Omit<ProductCreate, 'template_blob_path'>,
     templateFile: File
   ): Promise<Product> {
     const formData = new FormData();
     formData.append('file', templateFile);
     formData.append('client_id', data.client_id);
     formData.append('name', data.name);
     if (data.description) {
       formData.append('description', data.description);
     }
     formData.append('config_schema', JSON.stringify(data.config_schema));
     formData.append('template_version', data.template_version || '1.0.0');

     // Use fetch directly - DO NOT set Content-Type header
     const response = await fetch(`${API_BASE_URL}/api/v1/products/upload`, {
       method: 'POST',
       body: formData,
       // Let browser set Content-Type with multipart boundary
     });

     if (!response.ok) {
       const errorData = await response.json().catch(() => ({ detail: 'Upload failed' }));
       throw new ApiClientError(errorData.detail, response.status);
     }

     return response.json();
   }
   ```
4. Keep existing `createProduct()` for Phase 1 (JSON-based)
5. Run test (expect GREEN)
6. Commit: "feat(frontend): Add createProductWithFile API function"

**Alternative:** Modify `fetchApi` to skip Content-Type header when body is FormData:
```typescript
const config: RequestInit = {
  ...options,
  headers: {
    ...(!(options.body instanceof FormData) && { 'Content-Type': 'application/json' }),
    ...options.headers,
  },
};
```

### 8.2: Replace template path text input with file upload

1. Write test: `test_modal_shows_file_upload_input()`
   - Assert file input renders
   - Assert accepts `.blend` files only
   - Assert displays selected filename
2. Run test (expect RED)
3. Update modal form state:
   ```typescript
   interface ProductFormData {
     clientId: string;
     name: string;
     description: string;
     templateFile: File | null;  // Changed from templateBlobPath: string
     configSchema: string;
   }
   ```
4. Replace text input with file input:
   ```typescript
   <FormField label="Blender Template" required>
     <input
       type="file"
       accept=".blend"
       onChange={(e) => {
         const file = e.target.files?.[0] || null;
         setFormData({ ...formData, templateFile: file });
       }}
       className="block w-full text-sm text-neutral-500
         file:mr-4 file:py-2 file:px-4
         file:rounded-md file:border-0
         file:text-sm file:font-medium
         file:bg-primary-50 file:text-primary-700
         hover:file:bg-primary-100"
     />
     {formData.templateFile && (
       <p className="mt-1 text-sm text-neutral-600">
         Selected: {formData.templateFile.name} ({(formData.templateFile.size / 1024 / 1024).toFixed(2)} MB)
       </p>
     )}
   </FormField>
   ```
5. Run test (expect GREEN)
6. Commit: "feat(frontend): Replace template path with file upload"

### 8.3: Validate file selection and size

1. Write tests:
   - `test_validates_file_required()` - submit without file → error
   - `test_validates_file_size()` - submit file > 50MB → error
   - `test_validates_file_extension()` - submit non-.blend → error
2. Run tests (expect RED)
3. Add validation logic:
   ```typescript
   const MAX_FILE_SIZE_MB = 50;

   const validateForm = (): string | null => {
     if (!formData.templateFile) {
       return 'Please select a Blender template file';
     }

     if (!formData.templateFile.name.toLowerCase().endsWith('.blend')) {
       return 'File must have .blend extension';
     }

     const sizeMB = formData.templateFile.size / 1024 / 1024;
     if (sizeMB > MAX_FILE_SIZE_MB) {
       return `File size (${sizeMB.toFixed(2)}MB) exceeds ${MAX_FILE_SIZE_MB}MB limit`;
     }

     // ... other validation (name, config schema, etc.)
     return null;
   };
   ```
4. Run tests (expect GREEN)
5. Commit: "feat(frontend): Validate file upload requirements"

### 8.4: Update form submission to use file upload API

1. Write test: `test_submits_product_with_file()`
   - Mock `createProductWithFile`
   - Submit form with file selected
   - Assert called with correct data and file
2. Run test (expect RED)
3. Update submit handler:
   ```typescript
   const handleSubmit = async (e: React.FormEvent) => {
     e.preventDefault();

     const error = validateForm();
     if (error) {
       setError(error);
       return;
     }

     try {
       setIsSubmitting(true);
       const productData = {
         client_id: formData.clientId,
         name: formData.name,
         description: formData.description,
         config_schema: JSON.parse(formData.configSchema),
         template_version: '1.0.0',
       };

       await createProductWithFile(productData, formData.templateFile!);

       toast.success('Product created successfully!');
       onClose();
       onSuccess(); // Refresh product list
     } catch (err) {
       setError(err instanceof ApiClientError ? err.detail : 'Failed to create product');
     } finally {
       setIsSubmitting(false);
     }
   };
   ```
4. Run test (expect GREEN)
5. Commit: "feat(frontend): Implement product creation with file upload"

### 8.5: (Optional) Add file upload UX enhancements

**Future Enhancements (nice to have, not blocking):**
- Upload progress indicator for large files
- Drag-and-drop file upload zone
- File preview/confirmation before submit
- Better error messages for upload failures

**Basic improvement:**
Add loading spinner during upload (files can take time):
```typescript
{isSubmitting && (
  <div className="flex items-center gap-2 text-primary-600">
    <Spinner size="sm" />
    <span>Uploading template...</span>
  </div>
)}
```

Commit: "feat(frontend): Add upload loading indicator"

---

## Task 9: Integration Testing with File Upload

**Files:**
- Modify: `src/backend/tests/integration/test_product_creation_flow.py` ⚠️ **Note:** Path is `tests/integration/` not `tests/test_integration/`
- Modify: `src/backend/tests/conftest.py` (add blob storage mock fixture)

**Mock Strategy:** Integration tests should mock `BlobStorageService` to avoid actual Azure calls. Use `pytest-mock` to patch the service.

**TDD Steps:**

### 9.1: Add blob storage mock fixture

1. Add to `conftest.py`:
   ```python
   import pytest
   from unittest.mock import AsyncMock

   @pytest.fixture
   def mock_blob_storage(mocker):
       """Mock blob storage for tests that don't need real Azure."""
       mock_service = mocker.patch("app.api.v1.routes.products.BlobStorage")

       # Mock upload_template to return a test path
       async def mock_upload(file_data: bytes, filename: str) -> str:
           return f"product-templates/test-uuid/{filename}"

       mock_instance = AsyncMock()
       mock_instance.upload_template = AsyncMock(side_effect=mock_upload)
       mock_service.return_value = mock_instance

       return mock_instance
   ```
2. Commit: "test(backend): Add blob storage mock fixture"

### 9.2: End-to-end test with file upload

1. Write test: `test_create_product_with_file_upload_flow()`
   ```python
   async def test_create_product_with_file_upload_flow(
       client: AsyncClient,
       db_session: AsyncSession,
       mock_blob_storage,
   ):
       # Create valid client for FK
       from app.db.models import Client
       test_client = Client(name="Test Client")
       db_session.add(test_client)
       await db_session.commit()

       # Create mock .blend file with magic bytes
       blend_content = b"BLENDER-v3.0" + b"\x00" * 100
       files = {
           "file": ("test_product.blend", blend_content, "application/octet-stream")
       }
       data = {
           "client_id": str(test_client.id),
           "name": "Test Product with Upload",
           "description": "Integration test product",
           "config_schema": json.dumps({"type": "object", "properties": {}}),
           "template_version": "1.0.0",
       }

       # POST to /upload endpoint
       response = await client.post("/api/v1/products/upload", files=files, data=data)

       # Assert response
       assert response.status_code == 201
       response_data = response.json()
       assert response_data["name"] == "Test Product with Upload"
       assert "product-templates/test-uuid/test_product.blend" in response_data["template_blob_path"]

       # Assert product exists in DB
       from app.db.models import Product
       product = await db_session.get(Product, response_data["id"])
       assert product is not None
       assert product.name == "Test Product with Upload"

       # Assert blob upload was called
       mock_blob_storage.upload_template.assert_called_once()
       call_args = mock_blob_storage.upload_template.call_args
       assert call_args[0][0] == blend_content  # file_data
       assert "test_product.blend" in call_args[0][1]  # filename
   ```
2. Run test (expect RED)
3. Ensure all components work together (endpoint, validation, blob service, DB)
4. Run test (expect GREEN)
5. Commit: "test(backend): Add file upload integration test"

### 9.3: Test file validation in integration

1. Write tests for edge cases:
   - `test_upload_rejects_invalid_extension()` - .txt file → 422
   - `test_upload_rejects_invalid_magic_bytes()` - .blend without BLENDER header → 422
   - `test_upload_rejects_oversized_file()` - 100MB file → 422
2. Run tests (expect GREEN - validation already implemented in Task 7.3)
3. Commit: "test(backend): Add file validation integration tests"

### 9.4: (Optional) Test with real Azurite

**For comprehensive testing**, optionally test against real Azurite (not mocked):

1. Ensure Azurite is running (docker-compose.yml already has it)
2. Create fixture that uses real Azurite connection
3. Test full blob upload and retrieval
4. Clean up blobs after test

**Decision:** Can defer to avoid test complexity. Mock-based tests are sufficient for CI/CD.

---

## Verification

### Backend Verification
```bash
cd src/backend
make test          # All tests pass
make lint          # No linting errors
make check         # Full quality check
```

### Frontend Verification
```bash
cd src/frontend
npm test           # All tests pass
npm run build      # TypeScript compiles
npm run lint       # No linting errors
```

### Manual Testing - Phase 1 (Basic Fields)
1. Start backend: `cd src/backend && make dev`
2. Start frontend: `cd src/frontend && npm run dev`
3. Navigate to http://localhost:5173/products
4. Click "Add Product" button
5. Fill form:
   - Select a client
   - Enter product name
   - Add description (optional)
   - Enter template blob path (text, e.g., "templates/sample.blend")
   - Enter valid JSON for config schema
6. Submit form
7. Verify:
   - Product appears in list
   - No errors in console
   - Product saved to database

### Edge Cases to Test - Phase 1
- Missing required fields → validation error
- Invalid JSON in config schema → validation error
- Duplicate product name → allows (no unique constraint)
- Max length validation on name, description, template path

### Manual Testing - Phase 2 (File Upload)
1. After Phase 2 is complete, repeat Phase 1 test but:
2. Upload a .blend file instead of entering text path
3. Verify:
   - Product appears in list
   - No errors in console
   - File uploaded to Azure Blob (check logs or Azure portal)
   - Product record has blob path from Azure

### Edge Cases to Test - Phase 2
- Non-.blend file upload → validation error
- Large .blend file (>10MB) → handles gracefully
- Missing file → validation error

---

## Dependencies

### Python Packages (backend)

**Add to `src/backend/pyproject.toml`:**
```toml
dependencies = [
    # ... existing dependencies
    "azure-storage-blob>=12.19.0",
    "python-multipart>=0.0.6",  # FastAPI multipart support (may already exist)
]
```

**Install:**
```bash
cd src/backend
uv pip install azure-storage-blob python-multipart
```

**Note:** `python-multipart` may already be in dependencies (FastAPI uses it). Verify before adding.

### Environment Variables

**Add to `.env` (backend):**
```
AZURE_STORAGE_CONNECTION_STRING="<connection-string>"
AZURE_STORAGE_CONTAINER_NAME="product-templates"
```

**For local dev:** Use Azurite (already in `docker-compose.yml`). The default connection string `"UseDevelopmentStorage=true"` is already configured in `config.py`.

**For production:** Set actual Azure Storage connection string in environment/secrets.

---

## Notes

- **Two-phase approach:** Get basic CRUD working first (Phase 1), then add file upload complexity (Phase 2)
- This plan builds on existing `/clients` page patterns
- Phase 1 uses text input for template_blob_path as a temporary measure
- Phase 2 replaces text input with file upload and Azure Blob Storage
- Template version management (#143) is out of scope
- Client filtering (#142) is out of scope
- Future: Add product editing/deletion (separate story)
- Future: Preview uploaded .blend file (separate story)
- Future: Validate uploaded .blend file structure (separate story)

---

## Plan Review Changes (2026-01-23)

This plan was reviewed by specialized agents (code-architect, fastapi-pro, typescript-pro) and updated with the following improvements:

### Backend Changes

1. **Task 1:** Fixed test file paths (`tests/api/` not `tests/test_api/`), rewrote JSON validation to validate JSON Schema structure (not invalid JSON string), noted existing test coverage
2. **Task 6:** Made BlobStorageService async, added dependency injection pattern, improved error handling, noted existing azure_storage_connection_string config, removed file validation from service (moved to API layer)
3. **Task 7:** Created separate `/upload` endpoint instead of mixing JSON/multipart, added file size validation, magic byte validation (Blender files start with "BLENDER"), filename sanitization, transaction safety notes for blob rollback
4. **Task 9:** Added explicit mock strategy for BlobStorageService in integration tests, fixed test file paths

### Frontend Changes

1. **Task 2:** Added client name resolution strategy (fetch clients + create lookup map), noted shared component extraction opportunity
2. **Task 3:** Specified form state management approach (object pattern), added UI component requirements (Textarea, Select, FormField), improved client dropdown loading/error states, enhanced JSON validation with error messages
3. **Task 4:** Extracted FormField wrapper component, added responsive modal layout, UX enhancements (toast notifications, keyboard accessibility)
4. **Task 8:** Fixed fetchApi Content-Type issue (can't set for FormData), added file upload validation (size, extension, magic bytes), created separate `createProductWithFile` function, improved file upload UX

### General Improvements

- All test file paths corrected (`tests/api/` not `tests/test_api/`, `tests/integration/` not `tests/test_integration/`)
- Added foreign key constraint notes (tests should use valid client IDs)
- Improved test specificity (explicit test function names and assertions)
- Added `azure-storage-blob` to pyproject.toml dependencies (not just uv install)
- Better separation of concerns (validation in API layer, not service layer)
- Clearer documentation of future enhancements vs. current scope
