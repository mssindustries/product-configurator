# Product → Style Hierarchy & Blender File Upload

**Date:** 2026-01-23
**Status:** Approved for Implementation
**Domain:** Full-stack (backend, frontend, database)

---

## Overview

Refactor the Product entity to support multiple Styles, where each Style represents a variant of the product with its own Blender template file and customization schema. Implement file upload for .blend files to Azure Blob Storage.

---

## Goals

1. **Separate concerns:** Product = business grouping, Style = technical variant
2. **Enable multiple templates per product:** One product (e.g., "Range Hood") can have multiple styles ("Open Style", "Closed Style")
3. **File upload:** Allow MSS Admin to upload .blend files directly through the UI
4. **Maintain data integrity:** Each product has a default style
5. **Preserve existing data:** Migrate current products to Product+Style model

---

## Data Model

### Style Entity (NEW)

```python
class Style(Base):
    """Style variant of a Product."""

    id: UUID
    product_id: UUID  # FK to Product
    name: str  # e.g., "Open Style", "Modern", "Traditional"
    description: str | None
    template_blob_path: str  # Azure blob path: blender-templates/{style_id}.blend
    customization_schema: dict[str, Any]  # JSON Schema for controls
    default_glb_path: str | None  # Pre-generated default GLB
    is_default: bool  # One default per product
    display_order: int  # For UI sorting (default 0)
    created_at: datetime
    updated_at: datetime

    # Relationships
    product: Product
    configurations: list[ProductCustomization]
```

**Constraints:**
- Unique index on `(product_id, name)` - no duplicate style names per product
- Partial unique index on `(product_id)` WHERE `is_default = true` - exactly one default per product
- FK cascade: Product deleted → Styles deleted
- FK restrict: Style deletion blocked if configurations exist

### Product Entity (UPDATED)

```python
class Product(Base):
    """Product - high level product type."""

    id: UUID
    client_id: UUID  # FK to Client
    name: str  # e.g., "Range Hood", "Cabinet"
    description: str | None
    created_at: datetime
    updated_at: datetime

    # REMOVED: template_blob_path, config_schema, template_version

    # Relationships
    client: Client
    styles: list[Style]
    configurations: list[ProductCustomization]

    # Property
    @property
    def default_style(self) -> Style | None:
        return next((s for s in self.styles if s.is_default), None)
```

### ProductCustomization Entity (UPDATED)

```python
class ProductCustomization(Base):
    """Saved product configuration."""

    id: UUID
    product_id: UUID  # FK to Product
    style_id: UUID  # FK to Style (NEW)
    client_id: UUID  # FK to Client
    name: str
    config_data: dict[str, Any]
    product_schema_version: str
    created_at: datetime
    updated_at: datetime

    # Relationships
    product: Product
    style: Style  # NEW
    client: Client
    jobs: list[Job]
```

**FK constraint:** `style_id` uses `ondelete="RESTRICT"` to prevent deleting styles with active configurations.

---

## Blob Storage

### Container Structure

```
Container: blender-templates
Path: {style_id}.blend

Example:
blender-templates/550e8400-e29b-41d4-a716-446655440000.blend
```

**Why this approach:**
- Style UUID guarantees uniqueness (no collisions)
- Direct database-to-blob mapping (simple cleanup)
- Flat structure (no nested directories needed)

### File Upload Flow

1. Admin fills Style form (name, description, schema)
2. Admin selects .blend file via `<input type="file" accept=".blend">`
3. On submit → Frontend sends `multipart/form-data` to backend
4. Backend validates file (extension, size, mime type)
5. Backend creates Style record (gets UUID)
6. Backend uploads file to blob: `blender-templates/{style_id}.blend`
7. Backend saves `template_blob_path = "blender-templates/{style_id}.blend"`
8. Returns Style to frontend

### File Validation

- **Extension:** Must be `.blend`
- **Size:** Max 100MB (configurable via `BLENDER_TEMPLATE_MAX_SIZE_MB` env var)
- **Content-Type:** Accept `application/octet-stream` or `application/x-blender`

### Error Handling

- File invalid → Reject before creating DB record (HTTP 422)
- Blob upload fails → Rollback transaction, delete Style record
- Update with new file → Upload new blob, delete old blob, update path

---

## API Endpoints

### Style Endpoints (NEW)

**Nested under Product:**

```
POST   /api/v1/products/{product_id}/styles
GET    /api/v1/products/{product_id}/styles
GET    /api/v1/products/{product_id}/styles/{style_id}
PATCH  /api/v1/products/{product_id}/styles/{style_id}
DELETE /api/v1/products/{product_id}/styles/{style_id}
POST   /api/v1/products/{product_id}/styles/{style_id}/set-default
```

#### POST /api/v1/products/{product_id}/styles

**Request:** `multipart/form-data`
- `file`: .blend file (required)
- `name`: string (required)
- `description`: string (optional)
- `customization_schema`: JSON string (required)
- `is_default`: boolean (optional, default false)

**Response:** `StyleResponse`

**Business Rules:**
- First style for a product → auto-set `is_default=true`
- If `is_default=true` → unset `is_default` on other styles for this product
- Validate `customization_schema` is valid JSON Schema (Draft 7)
- Upload .blend to blob storage before committing

#### GET /api/v1/products/{product_id}/styles

**Query Params:**
- `skip`: int (default 0)
- `limit`: int (default 100)

**Response:** `StyleListResponse`
```json
{
  "items": [StyleResponse, ...],
  "total": 5
}
```

#### PATCH /api/v1/products/{product_id}/styles/{style_id}

**Request:** `multipart/form-data` (all fields optional)
- `file`: .blend file (if updating template)
- `name`: string
- `description`: string
- `customization_schema`: JSON string
- `is_default`: boolean

**Response:** `StyleResponse`

**Notes:**
- If new file uploaded → replace blob, update `template_blob_path`
- If `is_default=true` → unset on other styles

#### DELETE /api/v1/products/{product_id}/styles/{style_id}

**Response:** 204 No Content

**Validation:**
- Cannot delete if `is_default=true` (HTTP 400: "Cannot delete default style")
- Cannot delete if configurations exist (HTTP 409: "Style has existing configurations")
- On success → delete blob file from storage

#### POST /api/v1/products/{product_id}/styles/{style_id}/set-default

**Response:** `StyleResponse`

**Action:**
- Set `is_default=true` on this style
- Set `is_default=false` on all other styles for this product

### Product Endpoints (UPDATED)

#### GET /api/v1/products/{product_id}

**Response:** `ProductResponse` (now includes styles)
```json
{
  "id": "...",
  "client_id": "...",
  "name": "Range Hood",
  "description": "...",
  "created_at": "...",
  "updated_at": "...",
  "styles": [
    {
      "id": "...",
      "name": "Open Style",
      "is_default": true,
      ...
    }
  ]
}
```

#### POST /api/v1/products

**Request:** `ProductCreate` (fields removed)
```json
{
  "client_id": "...",
  "name": "Range Hood",
  "description": "..."
}
```

**Removed fields:**
- `template_blob_path`
- `config_schema`
- `template_version`

#### PATCH /api/v1/products/{product_id}

**Request:** `ProductUpdate` (same fields removed)

### ProductCustomization Endpoints (UPDATED)

#### POST /api/v1/configurations

**Request:** `ProductCustomizationCreate` (now requires `style_id`)
```json
{
  "product_id": "...",
  "style_id": "...",  // NEW - required
  "client_id": "...",
  "name": "Customer Config",
  "config_data": {...}
}
```

**Validation:**
- Verify `style.product_id == product_id` (HTTP 400 if mismatch)
- Validate `config_data` against `style.customization_schema` (HTTP 422 if invalid)

---

## Database Migration

**Approach:** One-way migration script (no rollback needed)

### Migration Script

**File:** `src/backend/scripts/migrate_to_styles.py`

```python
async def migrate():
    async with AsyncSessionLocal() as db:
        # Step 1: Fetch all products
        products = await db.execute(select(Product))

        for product in products.scalars().all():
            # Step 2: Create "Default" style from product's current fields
            default_style = Style(
                product_id=product.id,
                name="Default",
                description="Auto-migrated from product",
                template_blob_path=product.template_blob_path,
                customization_schema=product.config_schema,
                default_glb_path=None,
                is_default=True,
                display_order=0,
            )
            db.add(default_style)
            await db.flush()

            # Step 3: Update configurations to reference new style
            await db.execute(
                update(ProductCustomization)
                .where(ProductCustomization.product_id == product.id)
                .values(style_id=default_style.id)
            )

        await db.commit()
```

### Execution Steps

1. **Deploy code with dual support:**
   - Product model has old fields + new fields
   - Style model exists
   - ProductCustomization has both product_id and style_id

2. **Run migration script:**
   - Creates default styles
   - Populates configuration.style_id

3. **Verify data:**
   - Check all products have at least one style
   - Check all configurations have style_id

4. **Deploy final code:**
   - Remove old Product fields
   - Make ProductCustomization.style_id NOT NULL

---

## Frontend Changes

### Updated Components

#### ProductFormModal (UPDATED)

**Create Mode:**
- Single tab: "Basic Information"
- Fields: Client, Name, Description
- On save → Modal stays open, switches to "Styles" tab

**Edit Mode:**
- Tab 1: "Basic Information" (Client, Name, Description)
- Tab 2: "Styles" (list of styles + management)

**Styles Tab Layout:**

```
┌─────────────────────────────────────────────────┐
│ Basic Information │ Styles                      │
├─────────────────────────────────────────────────┤
│                                                 │
│  Styles for "Range Hood"          [+ Add Style] │
│                                                 │
│  [Style Card: Open Style (Default)]             │
│  [Style Card: Closed Style]                     │
│                                                 │
│  Empty State (if no styles):                    │
│  "No styles yet. Add your first style."         │
│  [+ Add First Style]                            │
└─────────────────────────────────────────────────┘
```

**Style Card:**
- Style name (with "Default" badge if is_default)
- Description snippet
- Created date
- Actions: [Edit] [Set as Default] [Delete]

**Clicking Add/Edit Style:**
- Opens StyleFormModal (nested modal)
- On save → StyleFormModal closes, Styles tab refreshes

#### StyleFormModal (NEW)

**Two-tab modal:**

**Tab 1: Basic Information**
- Name (text input, required)
- Description (textarea, optional)
- Blender Template (.blend file upload, required)
  - Shows selected filename
  - Max 100MB validation
- Is Default (checkbox, only if product has other styles)

**Tab 2: Customization Schema**
- JSON textarea (full height, like ProductFormModal)
- Syntax validation on blur
- JSON Schema structure validation

**File Upload Handling:**
- Convert to FormData for multipart/form-data
- Show upload progress (if possible)
- Handle errors (file too large, invalid type)

#### ProductsPage (UPDATED)

**Changes:**
- Product rows no longer display config schema info
- Removed: template_blob_path display
- "Edit" button now opens ProductFormModal with Styles tab

### New Type Definitions

**File:** `src/frontend/src/types/api.ts`

```typescript
export interface Product {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  // REMOVED: template_blob_path, config_schema, template_version
}

export interface Style {
  id: string;
  product_id: string;
  name: string;
  description: string | null;
  template_blob_path: string;
  customization_schema: Record<string, unknown>;
  default_glb_path: string | null;
  is_default: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface StyleCreate {
  name: string;
  description?: string | null;
  file: File;  // .blend file
  customization_schema: Record<string, unknown>;
  is_default?: boolean;
}

export interface ProductCustomization {
  id: string;
  product_id: string;
  style_id: string;  // NEW
  client_id: string;
  name: string;
  config_data: Record<string, unknown>;
  product_schema_version: string;
  created_at: string;
  updated_at: string;
}
```

### API Service Functions (NEW)

**File:** `src/frontend/src/services/api.ts`

```typescript
// Styles
export async function getStyles(productId: string): Promise<StyleListResponse>
export async function getStyle(productId: string, styleId: string): Promise<Style>
export async function createStyle(productId: string, data: FormData): Promise<Style>
export async function updateStyle(productId: string, styleId: string, data: FormData): Promise<Style>
export async function deleteStyle(productId: string, styleId: string): Promise<void>
export async function setDefaultStyle(productId: string, styleId: string): Promise<Style>
```

**FormData structure for createStyle/updateStyle:**
- `file`: File object
- `name`: string
- `description`: string
- `customization_schema`: JSON.stringify(schema object)
- `is_default`: "true" or "false"

---

## Implementation Phases

### Phase 1: Backend Foundation
**Goal:** Add Style entity, keep Product backward compatible

**Tasks:**
1. Create `Style` model in `app/db/models/style.py`
2. Update `Product` model (add styles relationship, keep old fields)
3. Update `ProductCustomization` model (add style_id, keep nullable)
4. Create `Style` schemas in `app/schemas/style.py`
5. Add style endpoints in `app/api/v1/routes/styles.py`
6. Create blob storage service in `app/services/blob_storage.py`
7. Write tests in `tests/api/test_styles.py`

**Verification:**
- All tests pass
- Can create styles via API
- File upload works
- Blob storage integration works

### Phase 2: Data Migration
**Goal:** Migrate existing products to Product+Style model

**Tasks:**
1. Write migration script `scripts/migrate_to_styles.py`
2. Test on copy of database
3. Run migration in dev environment
4. Verify all products have default style
5. Verify all configurations have style_id

**Verification:**
- No orphaned data
- All products have exactly one default style
- All configurations reference valid styles

### Phase 3: Backend Cleanup
**Goal:** Remove old Product fields

**Tasks:**
1. Remove `template_blob_path`, `config_schema`, `template_version` from Product model
2. Update Product schemas (remove old fields)
3. Make ProductCustomization.style_id NOT NULL
4. Update configuration validation (use style.customization_schema)
5. Update all tests

**Verification:**
- All backend tests pass
- API documentation updated
- No references to old Product fields

### Phase 4: Frontend Implementation
**Goal:** Update UI to support Product+Style hierarchy

**Tasks:**
1. Update type definitions in `types/api.ts`
2. Create StyleFormModal component
3. Update ProductFormModal (add Styles tab)
4. Add style API functions to `services/api.ts`
5. Update ProductsPage (remove old fields)
6. Write component tests

**Verification:**
- Can create products
- Can add/edit/delete styles
- File upload works in UI
- Styles tab displays correctly
- All frontend tests pass

---

## Testing Checklist

**Backend:**
- [ ] Create style with valid .blend file and schema
- [ ] Create style with invalid file type (should fail)
- [ ] Create style with file >100MB (should fail)
- [ ] Create style with invalid JSON Schema (should fail)
- [ ] First style auto-sets is_default=true
- [ ] Setting is_default=true unsets other defaults
- [ ] List styles for product (pagination works)
- [ ] Update style with new .blend file
- [ ] Update style without new file (keeps existing)
- [ ] Delete style with configurations (should fail)
- [ ] Delete default style (should fail)
- [ ] Delete blob file when style deleted
- [ ] Cascade delete: Product → Styles
- [ ] ProductCustomization validation uses style.customization_schema
- [ ] Cannot create configuration with style from different product

**Frontend:**
- [ ] Create product → modal switches to Styles tab
- [ ] Add first style → shows in list
- [ ] Edit style → updates in list
- [ ] Set as default → badge appears, old default updated
- [ ] Delete style → removed from list
- [ ] File upload shows filename
- [ ] File upload validates size
- [ ] JSON schema validation works
- [ ] Empty state displays correctly
- [ ] Nested modal (StyleFormModal) works

---

## Open Questions

None - design approved for implementation.

---

## Next Steps

1. Implement Phase 1 (Backend Foundation)
2. Test blob storage integration with Azurite
3. Run migration script on dev data
4. Implement frontend changes
5. End-to-end testing
6. Documentation updates
