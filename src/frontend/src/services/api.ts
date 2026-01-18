/**
 * API client service for communicating with the FastAPI backend.
 */

import type {
  Product,
  ProductCreate,
  ProductListResponse,
  Configuration,
  ConfigurationCreate,
  ConfigurationListResponse,
  Job,
  JobCreate,
  JobStatusResponse,
  ApiError,
  PaginationParams,
} from '../types/api';

// API base URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Custom error class for API errors.
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public detail?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

/**
 * Base fetch wrapper with error handling.
 */
async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    let detail = 'An error occurred';
    try {
      const errorData: ApiError = await response.json();
      detail = errorData.detail;
    } catch {
      detail = response.statusText;
    }

    throw new ApiClientError(
      `API Error: ${response.status} ${response.statusText}`,
      response.status,
      detail
    );
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

/**
 * Build query string from pagination params.
 */
function buildQueryString(params?: PaginationParams): string {
  if (!params) return '';
  const searchParams = new URLSearchParams();
  if (params.skip !== undefined) searchParams.set('skip', String(params.skip));
  if (params.limit !== undefined) searchParams.set('limit', String(params.limit));
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

// ============================================================================
// Products API
// ============================================================================

export async function getProducts(
  params?: PaginationParams
): Promise<ProductListResponse> {
  return fetchApi<ProductListResponse>(`/api/v1/products${buildQueryString(params)}`);
}

export async function getProduct(id: string): Promise<Product> {
  return fetchApi<Product>(`/api/v1/products/${id}`);
}

export async function createProduct(data: ProductCreate): Promise<Product> {
  return fetchApi<Product>('/api/v1/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

// ============================================================================
// Configurations API
// ============================================================================

export async function getConfigurations(
  params?: PaginationParams
): Promise<ConfigurationListResponse> {
  return fetchApi<ConfigurationListResponse>(
    `/api/v1/configurations${buildQueryString(params)}`
  );
}

export async function getConfiguration(id: string): Promise<Configuration> {
  return fetchApi<Configuration>(`/api/v1/configurations/${id}`);
}

export async function saveConfiguration(
  data: ConfigurationCreate
): Promise<Configuration> {
  return fetchApi<Configuration>('/api/v1/configurations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function deleteConfiguration(id: string): Promise<void> {
  return fetchApi<void>(`/api/v1/configurations/${id}`, {
    method: 'DELETE',
  });
}

// ============================================================================
// Jobs API
// ============================================================================

export async function createJob(data: JobCreate): Promise<Job> {
  return fetchApi<Job>('/api/v1/jobs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function getJob(id: string): Promise<Job> {
  return fetchApi<Job>(`/api/v1/jobs/${id}`);
}

export async function cancelJob(id: string): Promise<Job> {
  return fetchApi<Job>(`/api/v1/jobs/${id}/cancel`, {
    method: 'POST',
  });
}

// ============================================================================
// Job Polling
// ============================================================================

export interface PollOptions {
  /** Polling interval in milliseconds (default: 1000) */
  interval?: number;
  /** Maximum time to poll in milliseconds (default: 300000 = 5 minutes) */
  timeout?: number;
  /** Callback for progress updates */
  onProgress?: (status: JobStatusResponse) => void;
}

/**
 * Poll a job until it reaches a terminal state.
 * Returns the final job status.
 */
export async function pollJobStatus(
  jobId: string,
  options: PollOptions = {}
): Promise<JobStatusResponse> {
  const { interval = 1000, timeout = 300000, onProgress } = options;

  const startTime = Date.now();

  while (true) {
    const job = await getJob(jobId);

    const status: JobStatusResponse = {
      id: job.id,
      status: job.status,
      progress: job.progress,
      result_url: job.result_url,
      error_code: job.error_code,
      error_message: job.error_message,
    };

    onProgress?.(status);

    // Check for terminal states
    if (['COMPLETED', 'FAILED', 'CANCELLED'].includes(job.status)) {
      return status;
    }

    // Check timeout
    if (Date.now() - startTime > timeout) {
      throw new ApiClientError('Job polling timed out', 408, 'Polling timeout exceeded');
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
}
