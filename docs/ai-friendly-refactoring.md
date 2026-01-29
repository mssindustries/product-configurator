# AI-Friendly Refactoring Tracker

This document tracks systematic patterns in the codebase that make AI-assisted coding difficult, along with their proposed solutions and implementation status.

**Last Updated:** 2026-01-25

---

## Backend Patterns

### Pattern 1: Repeated "Get or 404" Logic ✅ COMPLETED

**Status:** ✅ Fully Completed - 2026-01-26

**Problem:** Every endpoint duplicates the same SELECT + None check + HTTPException pattern.

**Examples:**
- `products.py:97-105`
- `jobs.py:120-128`
- `configurations.py:100-108`

**Solution:** Generic Repository Pattern with domain exceptions
- Created `BaseRepository[ModelT]` with `ensure_exists(id)` method
- Created `EntityNotFoundError` domain exception
- Added global exception handler in `main.py`
- Created concrete repositories: `ProductRepository`, `ClientRepository`, `ProductCustomizationRepository`, `JobRepository`, `StyleRepository`

**Usage:**
```python
repo = ProductRepository(db)
product = await repo.ensure_exists(product_id)  # Auto 404 via exception handler
```

**Files Created/Modified:**
- ✅ `app/core/exceptions.py` - Added `EntityNotFoundError`
- ✅ `app/repositories/base.py` - Base repository class
- ✅ `app/repositories/product.py` - ProductRepository
- ✅ `app/repositories/client.py` - ClientRepository
- ✅ `app/repositories/configuration.py` - ProductCustomizationRepository
- ✅ `app/repositories/job.py` - JobRepository
- ✅ `app/repositories/style.py` - StyleRepository (with product-scoped methods)
- ✅ `app/repositories/__init__.py` - Exports
- ✅ `app/main.py` - Global exception handler
- ✅ `app/api/v1/routes/products.py` - Refactored
- ✅ `app/api/v1/routes/clients.py` - No changes needed
- ✅ `app/api/v1/routes/configurations.py` - Refactored
- ✅ `app/api/v1/routes/jobs.py` - Refactored
- ✅ `app/api/v1/routes/styles.py` - Refactored (removed old helpers)

**Results:**
- Eliminated ~50+ lines of duplicated code
- All 81 tests passing
- Consistent error responses across all endpoints

---

### Pattern 2: Manual Model-to-Schema Conversion

**Status:** 🔄 In Progress

**Problem:** Every endpoint manually constructs Pydantic response schemas from SQLAlchemy models, explicitly mapping each field.

**Examples:**
- `products.py:65-75` - Manual ProductResponse construction
- `jobs.py:80-94` - Manual JobResponse construction
- Note: `styles.py` already has `_style_to_response()` helper

**Solution:** Factory Methods on Response Schemas

Add `from_model()` and `from_models()` class methods to response schemas.

**Proposed Implementation:**
```python
# app/schemas/product.py
class ProductResponse(ProductBase):
    id: str
    client_id: str
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_model(cls, product: Product) -> "ProductResponse":
        """Create response from ORM model."""
        return cls(
            id=str(product.id),
            client_id=str(product.client_id),
            name=product.name,
            description=product.description,
            created_at=product.created_at,
            updated_at=product.updated_at,
        )

    @classmethod
    def from_models(cls, products: list[Product]) -> list["ProductResponse"]:
        """Create responses from list of ORM models."""
        return [cls.from_model(p) for p in products]

# Usage:
return ProductResponse.from_model(product)
```

**Files to modify:**
- `app/schemas/product.py` - Add factory methods
- `app/schemas/client.py` - Add factory methods
- `app/schemas/configuration.py` - Add factory methods
- `app/schemas/job.py` - Add factory methods
- `app/schemas/style.py` - Add factory methods
- All route files - Use factory methods

---

### Pattern 3: Repeated Pagination Logic

**Status:** 📋 Not Started

**Problem:** Pagination (count query + offset/limit query) is implemented identically in multiple endpoints.

**Examples:**
- `products.py:49-62`
- `configurations.py:49-62`
- `styles.py:330-346`

**Solution:** Repository Method for Paginated Queries

Add `list_paginated()` method to base repository.

**Proposed Implementation:**
```python
# app/repositories/base.py
@dataclass
class PaginatedResult(Generic[ModelT]):
    items: list[ModelT]
    total: int

class BaseRepository(Generic[ModelT]):
    async def list_paginated(
        self,
        *,
        skip: int = 0,
        limit: int = 20,
        order_by: Any = None,
        filters: list[Any] | None = None,
    ) -> PaginatedResult[ModelT]:
        """Get paginated list with total count."""
        # Implementation

# Usage:
result = await repo.list_paginated(skip=skip, limit=limit, order_by=Product.created_at.desc())
```

**Files to modify:**
- `app/repositories/base.py` - Add `list_paginated()` method
- All route files with list endpoints

---

### Pattern 4: Inconsistent ListResponse Schemas

**Status:** 📋 Not Started

**Problem:** Each entity has its own `*ListResponse` schema despite having a generic `PaginatedResponse[T]` that is unused.

**Examples:**
- `schemas/base.py:35-44` - Unused generic
- `schemas/client.py:32-36` - `ClientListResponse`
- `schemas/product.py:45-49` - `ProductListResponse`

**Solution:** Use Generic ListResponse

Create or use a simple generic list response.

**Proposed Implementation:**
```python
# schemas/base.py
class ListResponse(BaseModel, Generic[T]):
    """Simple list response with items and total."""
    items: list[T]
    total: int

# Usage:
@router.get("", response_model=ListResponse[ProductResponse])
async def list_products(...) -> ListResponse[ProductResponse]:
    return ListResponse(items=items, total=total)
```

**Files to modify:**
- `app/schemas/base.py` - Add/update generic ListResponse
- Remove individual `*ListResponse` classes from entity schemas
- Update route response_model declarations

---

### Pattern 5: Duplicate Name Uniqueness Check

**Status:** 📋 Not Started

**Problem:** Multiple endpoints check for duplicate names using nearly identical code.

**Examples:**
- `clients.py:72-80`
- `styles.py:145-161` (already has helper `_check_duplicate_name`)

**Solution:** Repository Method for Uniqueness Check

Add `ensure_unique()` method to base repository.

**Proposed Implementation:**
```python
# app/repositories/base.py
class BaseRepository(Generic[ModelT]):
    async def ensure_unique(
        self,
        field: str,
        value: Any,
        *,
        exclude_id: UUID | None = None,
        scope_filters: list[Any] | None = None,
    ) -> None:
        """Ensure field value is unique, raise 409 if not."""
        # Implementation raises EntityAlreadyExistsError

# Usage:
await repo.ensure_unique("name", client_data.name)
```

**Files to modify:**
- `app/core/exceptions.py` - Add `EntityAlreadyExistsError`
- `app/repositories/base.py` - Add `ensure_unique()` method
- `app/main.py` - Add exception handler for 409
- Route files using uniqueness checks

---

### Pattern 6: No Service Layer

**Status:** 📋 Not Started

**Problem:** Business logic (validation, complex operations) is embedded directly in route handlers.

**Examples:**
- `configurations.py:170-186` - JSON schema validation in route
- `styles.py:260-265` - Business rules in route

**Solution:** Service Layer Pattern

Create service classes that encapsulate business logic.

**Proposed Implementation:**
```python
# app/services/configuration.py
class ProductCustomizationService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = ProductCustomizationRepository(db)
        self.product_repo = ProductRepository(db)
        self.style_repo = StyleRepository(db)

    async def create(self, data: ProductCustomizationCreate) -> ProductCustomization:
        """Create a new configuration with validation."""
        # Validation logic here
        return await self.repo.create(...)

# Usage in route:
@router.post("")
async def create_configuration(config_data: ProductCustomizationCreate, db: DbSession):
    service = ProductCustomizationService(db)
    configuration = await service.create(config_data)
    return ProductCustomizationResponse.from_model(configuration)
```

**Files to create:**
- `app/services/__init__.py`
- `app/services/product.py`
- `app/services/configuration.py`
- `app/services/style.py`

---

### Pattern 7: Inconsistent Transaction Handling

**Status:** 📋 Not Started

**Problem:** Database transactions handled inconsistently (commit immediately, flush first, rollback handling varies).

**Examples:**
- `clients.py:85-87` - Direct commit
- `styles.py:277-302` - Flush + try/catch + rollback

**Solution:** Unit of Work Pattern or Transaction Context Manager

**Proposed Implementation:**
```python
# app/db/unit_of_work.py
from contextlib import asynccontextmanager

@asynccontextmanager
async def transaction(db: AsyncSession):
    """Context manager for transactions with auto-rollback."""
    try:
        yield db
        await db.commit()
    except Exception:
        await db.rollback()
        raise

# Usage:
async with transaction(db):
    service = StyleService(db)
    style = await service.create(data, file)
    return StyleResponse.from_model(style)
```

**Files to modify:**
- `app/db/unit_of_work.py` - Create transaction context manager
- Route files - Wrap operations in transaction context

---

### Pattern 8: Mixed Exception Handling Approaches

**Status:** ✅ Partially Complete

**Problem:** Custom exceptions exist but routes still raise `HTTPException` directly.

**Current State:**
- ✅ `EntityNotFoundError` implemented and used
- 📋 Need: `EntityAlreadyExistsError` (for 409 conflicts)
- 📋 Need: Consistent usage across all routes

**Solution:** Use Domain Exceptions Everywhere

Routes and services should raise domain exceptions; HTTP translation happens at the edge.

**Files to modify:**
- `app/core/exceptions.py` - Add remaining exception types
- `app/main.py` - Add remaining exception handlers
- All route files - Replace `HTTPException` with domain exceptions

---

### Pattern 9: Duplicated Test Fixtures

**Status:** 📋 Not Started

**Problem:** Test files duplicate similar fixtures across multiple files.

**Examples:**
- `tests/api/test_products.py:20-30` - `sample_product_data`
- `tests/api/test_configurations.py:13-20` - `sample_product_data`
- `tests/api/test_jobs.py:15-22` - `sample_product_data`

**Solution:** Centralized Fixtures in conftest.py

**Proposed Implementation:**
```python
# tests/conftest.py
@pytest.fixture
def client_id() -> str:
    """Generate a client ID for tests."""
    return str(uuid.uuid4())

@pytest.fixture
def sample_product_data(client_id: str) -> dict:
    """Standard product data for tests."""
    return {
        "client_id": client_id,
        "name": "Test Cabinet",
        "description": "A test cabinet product",
    }

@pytest.fixture
async def created_product(client: AsyncClient, sample_product_data: dict) -> dict:
    """Create a product and return its data."""
    response = await client.post("/api/v1/products", json=sample_product_data)
    assert response.status_code == 201
    return response.json()
```

**Files to modify:**
- `tests/conftest.py` - Add shared fixtures
- Remove duplicate fixtures from individual test files

---

## Frontend Patterns

### Pattern 1: Duplicated Data Fetching Logic

**Status:** 📋 Not Started

**Problem:** Same fetch-loading-error state management pattern repeated across pages.

**Examples:**
- `pages/ClientsPage.tsx:226-244`
- `pages/ProductsPage.tsx:228-251`
- `components/products/ProductFormModal.tsx:249-267`

**Solution:** Custom `useAsync` / `useList` Hook

**Proposed Implementation:**
```typescript
// hooks/useAsync.ts
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  options?: {
    immediate?: boolean;
    onSuccess?: (data: T) => void;
    onError?: (error: string) => void;
  }
): UseAsyncReturn<T>

export function useList<T>(
  fetchFn: () => Promise<{ items: T[]; total: number }>
)

// Usage:
const { items: clients, isLoading, error, refetch } = useList(getClients);
```

**Files to create:**
- `src/hooks/useAsync.ts`

**Files to modify:**
- `pages/ClientsPage.tsx`
- `pages/ProductsPage.tsx`
- `components/products/ProductFormModal.tsx`

---

### Pattern 2: Duplicated Utility Functions

**Status:** 📋 Not Started

**Problem:** `formatDate` function copy-pasted into 3 files with minor variations.

**Examples:**
- `pages/ClientsPage.tsx:9-16`
- `pages/ProductsPage.tsx:10-17`
- `components/products/ProductFormModal.tsx:67-74`

**Solution:** Centralized Utility Module

**Proposed Implementation:**
```typescript
// lib/format.ts
export type DateFormat = 'long' | 'short' | 'relative';

export function formatDate(
  dateString: string,
  format: DateFormat = 'long'
): string
```

**Files to create:**
- `src/lib/format.ts`

**Files to modify:**
- Remove local `formatDate` functions and import from utility

---

### Pattern 3: Duplicated Page State UI Components

**Status:** 📋 Not Started

**Problem:** `LoadingSkeleton`, `EmptyState`, `ErrorState` defined locally in each page.

**Examples:**
- `pages/ClientsPage.tsx:21-34` - LoadingSkeleton
- `pages/ProductsPage.tsx:22-41` - LoadingSkeleton
- `pages/ClientsPage.tsx:72-106` - ErrorState

**Solution:** Generic Page State Components

**Proposed Implementation:**
```typescript
// components/ui/PageStates.tsx
export function ListSkeleton({ rows, config }: ListSkeletonProps)
export function EmptyState({ icon, title, description, action }: EmptyStateProps)
export function ErrorState({ title, message, onRetry }: ErrorStateProps)
```

**Files to create:**
- `src/components/ui/PageStates.tsx`

**Files to modify:**
- Remove local implementations and import from ui

---

### Pattern 4: Inline SVG Icons Throughout Codebase ✅ COMPLETED

**Status:** ✅ Completed - 2026-01-25

**Problem:** SVG icons copied inline throughout codebase (36 occurrences across 11 files).

**Solution:** Icon Component Library

**Implementation:**
```typescript
// components/ui/Icon.tsx
export type IconName =
  | 'building' | 'check' | 'checkCircle' | 'chevronDown' | 'cube'
  | 'document' | 'edit' | 'home' | 'info' | 'plus' | 'spinner'
  | 'star' | 'styles' | 'trash' | 'upload' | 'warning' | 'x';

export const Icon = forwardRef<SVGSVGElement, IconProps>(
  ({ name, size = 'md', className, ...props }, ref) => { ... }
);

// Usage:
<Icon name="plus" size="md" />
<Icon name="spinner" className="animate-spin" />
```

**Files:**
- Created: `src/frontend/src/components/ui/Icon.tsx` - Icon component with 17 icon types
- Modified: 11 files (Button, Toast, FileUpload, Navigation, RoleSwitcher, AdminPage, ClientPage, ClientsPage, ProductsPage, ProductFormModal, StyleFormModal)
- Replaced: 36 inline SVG occurrences

---

### Pattern 5: Inconsistent Controlled vs Uncontrolled Tabs

**Status:** 📋 Not Started

**Problem:** Two different tab implementations (reusable Tabs component vs manual controlled tabs).

**Examples:**
- `components/ui/Tabs.tsx` - Uncontrolled only
- `components/products/ProductFormModal.tsx:244,591-627` - Manual controlled

**Solution:** Support Both Controlled and Uncontrolled Tabs

**Proposed Implementation:**
```typescript
interface TabsProps {
  defaultTab?: string;  // Uncontrolled
  value?: string;       // Controlled
  onValueChange?: (value: string) => void;
  children: ReactNode;
}

// Usage (controlled):
<Tabs value={activeTab} onValueChange={setActiveTab}>
```

**Files to modify:**
- `src/components/ui/Tabs.tsx` - Add controlled mode support
- `src/components/products/ProductFormModal.tsx` - Use Tabs component

---

### Pattern 6: Missing Generic Async Form Modal Pattern

**Status:** 📋 Not Started

**Problem:** `ProductFormModal` (903 lines) and `StyleFormModal` (517 lines) share identical structure.

**Solution:** Generic Form Modal Hook

**Proposed Implementation:**
```typescript
// hooks/useFormModal.ts
export function useFormModal<TData, TErrors, TResult>({
  initialData,
  validate,
  onSubmit,
  onSuccess,
  isOpen,
  onClose,
}: UseFormModalOptions<TData, TErrors, TResult>)
```

**Files to create:**
- `src/hooks/useFormModal.ts`

**Files to modify:**
- `src/components/products/ProductFormModal.tsx` - Use hook
- `src/components/products/StyleFormModal.tsx` - Use hook

---

### Pattern 7: Repeated Page Layout Boilerplate

**Status:** 📋 Not Started

**Problem:** Every page repeats same layout wrapper structure.

**Examples:**
- `pages/ClientsPage.tsx:286-343`
- `pages/ProductsPage.tsx:285-348`

**Solution:** Page Layout Component

**Proposed Implementation:**
```typescript
// components/layout/PageLayout.tsx
export function PageLayout({
  title,
  description,
  action,
  children,
  maxWidth = '4xl',
}: PageLayoutProps)

// Usage:
<PageLayout
  title="Clients"
  description="Manage your client accounts."
  action={<Button>Add Client</Button>}
>
  {children}
</PageLayout>
```

**Files to create:**
- `src/components/layout/PageLayout.tsx`

**Files to modify:**
- All page components

---

## Priority Order

### Backend (by impact/effort ratio)
1. ✅ Repository Pattern (completed)
2. 🔄 Model-to-Schema Conversion (in progress)
3. Pagination Logic
4. Uniqueness Checks
5. Service Layer
6. Exception Handling (complete)
7. ListResponse Schemas
8. Transaction Handling
9. Test Fixtures

### Frontend (by impact/effort ratio)
1. ✅ Icon Component Library (completed)
2. `useAsync`/`useList` hooks (high impact, medium effort)
3. `formatDate` utility (medium impact, low effort)
4. Page State Components (high impact, medium effort)
5. Controlled/Uncontrolled Tabs (medium impact, low effort)
6. `useFormModal` hook (high impact, medium effort)
7. Page Layout Component (medium impact, low effort)

---

## Notes

- **Status Legend:**
  - ✅ Completed
  - 🔄 In Progress
  - 📋 Not Started

- **This document should be updated as patterns are completed**
- Each pattern includes file locations for easy reference
- Solutions include code examples for consistency
