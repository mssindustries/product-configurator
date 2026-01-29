# Product Customizer - Client Interaction Design

**Date:** 2026-01-23
**Status:** Design Complete
**Domain:** Full-stack (frontend, backend, infrastructure)

---

## Overview

A B2B SaaS platform where manufacturers (Clients) use real-time 3D visualization to configure custom products with their customers. The platform enables Clients to demonstrate product customizations interactively, save configurations with customer information, and submit them to MSS Industries for CAD drawing and manufacturing.

---

## Terminology

- **MSS Industries** - Platform owner, manages all Clients and product setup
- **Client** - Manufacturer/business using the platform (e.g., cabinet company, range hood manufacturer)
- **Customer** - The Client's end customer (person buying the customized product)
- **Product** - High-level product type (e.g., "Range Hood", "Cabinet", "Fireplace Cover")
- **Style** - Specific variant of a Product (e.g., "Open Style", "Closed Style")
- **ProductCustomization** - Saved customization with customer information

---

## Core User Flows

### High-Level Flow

```
MSS Admin Setup:
1. Create Client account
2. Configure Products & Styles for that Client
3. Upload Blender files and define customizations per Style
4. Send invitation to Client

Client Usage:
1. Client logs in (OAuth with Google/Microsoft)
2. Selects Product → Style
3. Adjusts customizations in sidebar
4. Clicks "Update Preview" to generate 3D model via Blender
5. Shows customer the 3D visualization
6. Saves configuration with customer info
7. Can view/edit/duplicate/delete saved configs later
8. Submits configuration to MSS Industries

MSS Admin Production:
1. Views submitted configurations queue
2. Creates CAD drawings for manufacturing
3. Proceeds with production
```

---

## Data Model

### Client
- Identity (linked to OAuth provider - Google or Microsoft)
- Company name
- Contact email
- Role (Client or Admin)
- Assigned Products (many-to-many relationship)
- Created/updated timestamps

### Product
- Name (e.g., "Range Hood", "Cabinet")
- Description
- Belongs to one or more Clients (many-to-many)
- Created/updated timestamps

### Style
- Name (e.g., "Open Style", "Closed Style")
- Belongs to one Product (many-to-one)
- Blender file reference (Azure Blob Storage path)
- Customization schema (JSON defining controls + default values)
- Default GLB file (pre-generated from default parameters)
- Created/updated timestamps

**Customization Schema Example:**
```json
{
  "controls": [
    {
      "type": "slider",
      "label": "Width (inches)",
      "param": "width",
      "min": 24,
      "max": 60,
      "step": 1,
      "default": 36
    },
    {
      "type": "dropdown",
      "label": "Finish",
      "param": "finish",
      "options": ["stainless", "copper", "brass"],
      "default": "stainless"
    },
    {
      "type": "color",
      "label": "Paint Color",
      "param": "paint_color",
      "default": "#FFFFFF"
    }
  ]
}
```

### ProductCustomization
- Belongs to one Client
- References Product + Style
- Customer name (required)
- Customer email
- Customer phone
- Notes (project details, special requests, etc.)
- Parameter values (JSON: `{"width": 48, "finish": "stainless"}`)
- Submitted flag (boolean - whether submitted to MSS)
- Created/updated timestamps

### GenerationJob (temporary)
- Job ID (UUID)
- Style reference
- Parameter values (JSON)
- Status (pending, processing, completed, failed)
- Result GLB URL (temporary blob storage)
- Error message (if failed)
- Created timestamp
- Cleanup after X hours (24 hours suggested)

---

## Architecture

### Frontend (Vite + React + React Three Fiber)
- **Authentication** - OAuth flow with Google and Microsoft
- **Product/Style Selection** - Browse assigned products, select style
- **3D Viewer** - React Three Fiber with OrbitControls (rotate + zoom)
- **Customization Sidebar** - Dynamic controls rendered from Style schema
- **ProductCustomization Management** - Save/load/edit/delete/submit
- **Job Polling** - Poll generation job status every 2 seconds

### Backend (FastAPI + Python)
- **OAuth Integration** - Google and Microsoft OAuth providers
- **REST API** - Endpoints for products, configurations, generation
- **Async Job Queue** - Background Blender generation tasks
- **PostgreSQL Database** - SQLAlchemy 2.0 async ORM
- **Azure Blob Storage** - Blender files, default GLBs, generated GLBs
- **Role-Based Access Control** - Client vs Admin permissions per endpoint

### Blender Service
- **Headless Execution** - Runs inside backend container
- **Parameter Interface** - Accepts JSON parameters from backend
- **GLB Generation** - Loads .blend file, applies parameters, exports GLB
- **Blob Upload** - Uploads generated GLB to temporary storage
- **Error Handling** - Returns status and error messages

### Storage (Azure Blob)
- **blender-files** - Permanent storage for .blend files (Admin upload)
- **default-models** - Permanent storage for default GLBs per Style
- **generated-models-temp** - Temporary storage for on-demand GLBs (24-hour cleanup)

---

## User Workflows

### MSS Admin: Setting Up a New Client

1. Admin logs into admin portal
2. Navigate to "Clients" → "Create New Client"
3. Fill in Client details (company name, contact email)
4. Assign Products to this Client (select from available Products)
5. Click "Send Invitation"
6. System generates invite link, sends email to Client contact
7. Client status: "Invited" (waiting for OAuth completion)

### MSS Admin: Creating Products and Styles

**Create Product:**
1. Navigate to "Products" → "Create New Product"
2. Enter Product name (e.g., "Range Hood") and description
3. Save Product

**Add Style to Product:**
1. Navigate into Product → "Add Style"
2. Enter Style name (e.g., "Open Style")
3. Upload .blend file (stored in Azure Blob `blender-files` container)
4. Define customization schema (JSON editor):
   - Add controls (slider, dropdown, color picker)
   - Set parameter names that map to Blender script variables
   - Define constraints (min/max for sliders, allowed values for dropdowns)
   - Set default values for each parameter
5. Click "Generate Default Preview"
   - Backend runs Blender with default parameters
   - Generates default GLB file
6. Review default GLB in preview
7. Save Style

### Client: Initial Login (First Time)

1. Client receives invitation email from MSS Industries
2. Clicks invitation link in email
3. Redirected to OAuth provider selection (Google or Microsoft)
4. Selects provider and authorizes the app
5. Completes OAuth flow
6. Redirected back to platform
7. Account activated, lands on Client dashboard

### Client: Subsequent Logins

1. Navigate to platform URL
2. Click "Sign in with Google" or "Sign in with Microsoft"
3. OAuth flow (if already authorized, instant redirect)
4. Lands on Client dashboard

### Client: Creating a ProductCustomization

1. **Dashboard:** Click "Start New ProductCustomization"
2. **Product Selection:** Grid/list of assigned Products, select one (e.g., "Range Hood")
3. **Style Selection:** Grid/list of Styles for that Product, select one (e.g., "Open Style")
4. **ProductCustomization Screen Loads:**
   - 3D viewer shows default GLB model immediately
   - Sidebar shows customization controls (dynamically generated from Style schema)
   - Sidebar is expanded by default
   - "Update Preview" button visible
5. **Client adjusts controls** (with customer watching via screen-share or in-person):
   - Move sliders (dimensions)
   - Select dropdown options (materials, finishes)
   - Pick colors
6. **Click "Update Preview":**
   - Loading state appears (spinner + "Generating preview...")
   - Frontend calls `POST /api/generate` with parameters
   - Backend returns job ID
   - Frontend polls `GET /api/jobs/{job_id}` every 2 seconds
   - When job status = "completed", frontend loads new GLB URL
   - 3D viewer updates with new model
7. **Client/customer review 3D model:**
   - Rotate model with mouse (orbit controls)
   - Zoom in/out with scroll wheel
   - Toggle sidebar collapse for full-screen 3D view
8. **Repeat steps 5-7** as needed (make adjustments, regenerate)
9. **When satisfied, click "Save ProductCustomization":**
   - Modal appears requesting:
     - Customer name (required)
     - Customer email
     - Customer phone
     - Notes (text area for project details, special requests, etc.)
   - Fill form and click Save
10. **ProductCustomization saved:**
    - Success message
    - Redirected to ProductCustomizations list

### Client: Managing Saved ProductCustomizations

**View ProductCustomizations List:**
1. Dashboard → "Saved ProductCustomizations"
2. Chronological list (newest first) showing:
   - Customer name
   - Product + Style
   - Submitted status
   - Date saved
3. Search bar at top (filter by customer name)

**View/Edit ProductCustomization:**
1. Click on a configuration to open detail view
2. Customer info displayed (name, email, phone, notes)
3. 3D viewer loads last generated GLB (if available)
4. Sidebar shows saved parameter values
5. Available actions:
   - **Edit** - Adjust parameters, click "Update Preview", click "Save" to update
   - **Duplicate** - "Save As New" creates copy with option to enter new customer info
   - **Delete** - Confirm dialog, then remove configuration
   - **Submit** - Mark configuration as submitted to MSS Industries

**Note:** Behavior after submission (whether locked or editable) is TBD - to be determined based on real-world workflow needs.

### MSS Admin: Viewing Submitted ProductCustomizations

1. Admin portal → "Submitted ProductCustomizations"
2. List/queue of all submitted configurations across all Clients
3. Shows:
   - Client name
   - Customer name
   - Product + Style
   - Date submitted
   - ProductCustomization parameters
4. Click to view:
   - Full customer details
   - 3D model (load saved GLB)
   - All parameter values
5. Use configuration data to create CAD drawings for manufacturing

---

## API Endpoints

### Authentication
- `GET /auth/login` - Initiate OAuth flow (provider selection)
- `GET /auth/callback` - OAuth callback handler
- `GET /auth/me` - Get current authenticated user info
- `POST /auth/logout` - End session

**Note:** OAuth providers (Firebase, Azure Entra ID) handle most of the flow. Backend validates tokens and manages sessions.

### Products & Styles
- `GET /api/products`
  - **Client role:** Returns only assigned Products
  - **Admin role:** Returns all Products
- `POST /api/products` - Create new Product (Admin only)
- `GET /api/products/{id}/styles` - List Styles for a Product
- `POST /api/products/{id}/styles` - Create new Style (Admin only)
- `GET /api/styles/{id}` - Get Style details (schema, default GLB URL)
- `POST /api/styles/{id}/upload-blend` - Upload Blender file for Style (Admin only)

### ProductCustomizations
- `GET /api/configurations`
  - **Client role:** Returns only their own configurations
  - **Admin role:** Can filter by Client, or view all submitted configs
  - Query params: `search` (customer name), `submitted` (boolean filter)
- `POST /api/configurations` - Save new configuration
- `GET /api/configurations/{id}` - Get specific configuration
- `PUT /api/configurations/{id}` - Update configuration (parameters, customer info)
- `POST /api/configurations/{id}/submit` - Mark configuration as submitted
- `DELETE /api/configurations/{id}` - Delete configuration

### Clients (Admin Management)
- `GET /api/clients` - List all Clients (Admin only)
- `POST /api/clients` - Create new Client account (Admin only)
- `POST /api/clients/{id}/invite` - Send invitation email (Admin only)

### 3D Generation (Async Job Queue)
- `POST /api/generate`
  - Body: `{"style_id": "uuid", "parameters": {"width": 48, "finish": "stainless"}}`
  - Returns: `{"job_id": "uuid"}`
- `GET /api/jobs/{job_id}`
  - Returns: `{"status": "pending|processing|completed|failed", "result_url": "https://...", "error": "..."}`

---

## Frontend Architecture

### Routes

```
/login                      - OAuth provider selection
/dashboard                  - Client landing page (start new / view saved)
/configure/products         - Product selection
/configure/styles/:productId - Style selection
/configure/session          - Active configuration (3D viewer + sidebar)
/configurations             - List of saved configurations
/configurations/:id         - View/edit specific configuration

/admin                      - MSS Admin dashboard
/admin/clients              - Client management
/admin/products             - Product/Style management
/admin/submitted            - Submitted configurations queue
```

### Key Components

**ProductCustomizationSession**
- Main container for active configuration
- 3D Viewer (React Three Fiber canvas)
- Collapsible Sidebar (customization controls)
- Control buttons:
  - "Update Preview" - Trigger Blender generation
  - "Save" - Save configuration
  - "Back" - Return to product selection
  - Sidebar toggle (collapse/expand)

**Viewer3D**
- React Three Fiber `<Canvas>`
- `<OrbitControls>` - Mouse drag to rotate, scroll to zoom
- GLB model loader (`useGLTF` hook)
- Lighting setup (ambient + directional)
- Loading state (spinner while GLB loads)

**CustomizationSidebar**
- Dynamic control rendering based on Style schema
- Control components:
  - **SliderControl** - Numeric input with range (min, max, step)
  - **DropdownControl** - Select from predefined options
  - **ColorPickerControl** - Color selection
- Collapse/expand toggle button
- Parameter values managed in parent state

**ProductCustomizationList**
- Search input (filter by customer name)
- ProductCustomization cards/rows with:
  - Customer name
  - Product + Style
  - Date saved
  - Submitted badge (if submitted)
- Actions dropdown (view, edit, duplicate, delete, submit)

**ProductStyleSelector**
- Product grid/list with images or icons
- Style grid/list with default preview images
- Click to proceed to configuration

---

## Blender Integration

### Generation Flow

1. **Frontend triggers generation:**
   ```javascript
   POST /api/generate
   {
     "style_id": "abc123",
     "parameters": {
       "width": 48,
       "finish": "stainless",
       "door_style": "glass"
     }
   }
   ```

2. **Backend creates GenerationJob:**
   - Inserts record with status: "pending"
   - Returns job ID to frontend
   - Queues async background task

3. **Async worker executes:**
   - Updates job status to "processing"
   - Downloads .blend file from Azure Blob Storage
   - Executes Blender headless with Python script
   - Script interface:
     ```python
     def generate(parameters: dict) -> str:
         """
         Apply parameters to Blender scene and export GLB

         Args:
             parameters: Dict of parameter values from frontend

         Returns:
             Path to exported GLB file
         """
         # Load scene
         # Apply parameters to objects/materials
         # Export to GLB format
         # Return file path
     ```
   - Uploads generated GLB to Azure Blob (`generated-models-temp` container)
   - Updates job status to "completed", stores GLB URL
   - If error occurs: status = "failed", stores error message

4. **Frontend polls job status:**
   ```javascript
   GET /api/jobs/{job_id}
   // Every 2 seconds until status != "pending" or "processing"
   ```

5. **On completion:**
   - Frontend receives GLB URL
   - Loads new model in Three.js viewer
   - Removes loading state

### Error Handling

**Timeout:**
- Backend sets 60-second timeout on Blender execution
- If exceeded: job status = "failed", error = "Generation timeout"

**Blender Errors:**
- Python script exceptions caught by backend
- Job status = "failed", error message stored
- Frontend displays error: "Generation failed: {error message}"
- "Retry" button available
- Previous GLB model remains visible in viewer

**Network/Storage Errors:**
- Blob download/upload failures logged
- Job status = "failed"
- Generic error message to user

---

## UI/UX Details

### ProductCustomization Screen Layout

**Desktop (1920x1080):**
```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  Range Hood > Open Style        [Save] [Back]   │
├─────────────────────────────────────────────────────────┤
│                                    │                     │
│                                    │  Width: [====o==]   │
│                                    │  24        60       │
│         3D Viewer                  │                     │
│      (React Three Fiber)           │  Height: [==o====]  │
│                                    │  12        24       │
│    [Model rotates/zooms here]      │                     │
│                                    │  Finish:            │
│                                    │  [Stainless ▼]      │
│                                    │                     │
│                                    │  Paint Color:       │
│                                    │  [  🎨  ]           │
│                                    │                     │
│       [Update Preview]             │                     │
│                                    │  [⟨ Collapse]       │
└─────────────────────────────────────────────────────────┘
     70% width                          30% width
```

**Sidebar Collapsed:**
```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  Range Hood > Open Style        [Save] [Back]   │
├──────────────────────────────────────────────────────┬──┤
│                                                       │⟩ │
│                                                       │  │
│                                                       │E │
│               Full-Screen 3D Viewer                   │x │
│                                                       │p │
│           [Model takes full width]                    │a │
│                                                       │n │
│                                                       │d │
│                                                       │  │
│                  [Update Preview]                     │  │
│                                                       │  │
└──────────────────────────────────────────────────────┴──┘
```

### 3D Viewer Controls

**Mouse Interactions:**
- **Left-click + drag** - Rotate/orbit around model
- **Scroll wheel** - Zoom in/out
- **Double-click** - Reset camera to default position (future feature)

**Camera:**
- Default position: 45° angle, medium distance
- Auto-centers on model bounds
- Smooth transitions when loading new models

### Loading States

**Initial Load (Style selection):**
- Immediately shows default GLB (pre-generated)
- No loading spinner needed

**Update Preview Click:**
1. "Update Preview" button becomes disabled
2. Show spinner overlay on 3D viewer: "Generating preview..."
3. Previous model remains visible behind overlay
4. Poll job status every 2 seconds
5. On completion:
   - Remove spinner
   - Fade in new model
   - Re-enable button
6. On timeout/error:
   - Remove spinner
   - Show error message with "Retry" button
   - Keep previous model visible

### Save ProductCustomization Modal

```
┌─────────────────────────────────────────────┐
│  Save ProductCustomization                    [×]  │
├─────────────────────────────────────────────┤
│                                             │
│  Customer Name *                            │
│  [_________________________________]        │
│                                             │
│  Email                                      │
│  [_________________________________]        │
│                                             │
│  Phone                                      │
│  [_________________________________]        │
│                                             │
│  Notes                                      │
│  ┌───────────────────────────────────────┐ │
│  │                                       │ │
│  │  (Project details, special requests)  │ │
│  │                                       │ │
│  └───────────────────────────────────────┘ │
│                                             │
│                    [Cancel]  [Save]         │
└─────────────────────────────────────────────┘
```

---

## Future Enhancements (Deferred)

The following features were discussed but are deferred to later phases:

### Pricing & Quoting
- Automatic price calculation based on parameters
- Quote generation (PDF export)
- Manual pricing workflow

### Export Features
- Download GLB file for customer
- Screenshot/render generation for sharing
- Print-ready configuration summary

### Performance Optimizations
- GLB caching by parameters (avoid regenerating identical configs)
- Pre-generate common configurations
- Thumbnail generation for saved configs list

### Post-Submit Workflow
- Define whether configurations can be edited after submission
- Status transitions (Submitted → In Production → Complete)
- Notifications to Clients when status changes

### Multi-User per Client
- Multiple team members per Client account
- User roles and permissions within Client organization
- Shared vs. personal configurations

### Advanced 3D Viewer
- Preset camera angles (front, side, top views)
- Exploded view for complex assemblies
- Measurement tools
- AR preview (mobile)

### Admin Features
- Analytics dashboard (usage stats, popular configurations)
- Bulk product import
- Template configurations
- Customer relationship management (CRM) integration

---

## Open Questions

1. **Post-submission editing:** Can Clients edit configurations after submitting, or should they be locked?
2. **Blender performance:** What's the realistic generation time? (Will inform UX decisions around polling frequency, timeout duration)
3. **ProductCustomization versioning:** Should edits create new versions or overwrite existing configurations?
4. **Status workflow:** Do we need intermediate statuses (In Production, Complete), or is Submitted sufficient for MVP?
5. **Multi-user timing:** When should we add support for multiple users per Client?

---

## Next Steps

1. **Implementation Planning:** Create detailed task breakdown for development
2. **Blender Performance Testing:** Run benchmark tests to determine realistic generation times
3. **Schema Validation:** Define JSON schema for customization controls (validate admin input)
4. **OAuth Provider Setup:** Configure Google and Microsoft OAuth apps
5. **Database Schema:** Finalize SQLAlchemy models based on this design
6. **Wireframe Review:** Create high-fidelity mockups for Client and Admin UIs (optional)
