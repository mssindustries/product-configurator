/**
 * TypeScript types matching backend API schemas.
 */

// Job status enum matching backend JobStatus
export type JobStatus =
  | 'PENDING'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

// Client types
export interface Client {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ClientCreate {
  name: string;
}

export interface ClientUpdate {
  name?: string;
}

export interface ClientListResponse {
  items: Client[];
  total: number;
}

// Product types
export interface Product {
  id: string;
  client_id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  // Note: styles are fetched separately via getStyles(productId)
}

export interface ProductCreate {
  client_id: string;
  name: string;
  description?: string | null;
}

export interface ProductUpdate {
  name?: string;
  description?: string | null;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
}

// Style types
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
  file: File; // .blend file
  customization_schema: Record<string, unknown>;
  is_default?: boolean;
}

export interface StyleUpdate {
  name?: string;
  description?: string | null;
  file?: File; // .blend file (optional for updates)
  customization_schema?: Record<string, unknown>;
  is_default?: boolean;
}

export interface StyleListResponse {
  items: Style[];
  total: number;
}

// Product Customization types
export interface ProductCustomization {
  id: string;
  product_id: string;
  style_id: string; // Reference to Style
  client_id: string;
  name: string;
  config_data: Record<string, unknown>;
  product_schema_version: string;
  created_at: string;
  updated_at: string;
}

export interface ProductCustomizationCreate {
  product_id: string;
  style_id: string; // Reference to Style (required)
  client_id: string;
  name: string;
  config_data: Record<string, unknown>;
}

export interface ProductCustomizationListResponse {
  items: ProductCustomization[];
  total: number;
}

// Job types
export interface Job {
  id: string;
  product_customization_id: string;
  status: JobStatus;
  progress: number;
  result_url: string | null;
  error_code: string | null;
  error_message: string | null;
  retry_count: number;
  max_retries: number;
  worker_id: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface JobCreate {
  product_customization_id: string;
}

export interface JobStatusResponse {
  id: string;
  status: JobStatus;
  progress: number;
  result_url: string | null;
  error_code: string | null;
  error_message: string | null;
}

export interface JobListResponse {
  items: Job[];
  total: number;
}

// API Error
export interface ApiError {
  detail: string;
}

// Pagination params
export interface PaginationParams {
  skip?: number;
  limit?: number;
}
