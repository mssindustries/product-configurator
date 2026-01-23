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
  enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface ClientCreate {
  name: string;
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
  template_blob_path: string;
  template_version: string;
  config_schema: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface ProductCreate {
  client_id: string;
  name: string;
  description?: string | null;
  template_blob_path: string;
  template_version?: string;
  config_schema: Record<string, unknown>;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
}

// Configuration types
export interface Configuration {
  id: string;
  product_id: string;
  client_id: string;
  name: string;
  config_data: Record<string, unknown>;
  product_schema_version: string;
  created_at: string;
  updated_at: string;
}

export interface ConfigurationCreate {
  product_id: string;
  client_id: string;
  name: string;
  config_data: Record<string, unknown>;
}

export interface ConfigurationListResponse {
  items: Configuration[];
  total: number;
}

// Job types
export interface Job {
  id: string;
  configuration_id: string;
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
  configuration_id: string;
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
