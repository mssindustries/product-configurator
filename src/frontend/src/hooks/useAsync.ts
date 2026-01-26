import { useState, useEffect, useCallback } from 'react';
import { ApiClientError } from '../services/api';

/**
 * State for async operations.
 */
interface AsyncState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

/**
 * Return type for useAsync hook.
 */
interface UseAsyncReturn<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
  execute: () => Promise<T | undefined>;
  refetch: () => Promise<T | undefined>;
}

/**
 * Options for useAsync hook.
 */
interface UseAsyncOptions<T> {
  /** Whether to execute the async function immediately on mount. Defaults to true. */
  immediate?: boolean;
  /** Callback to run on successful execution */
  onSuccess?: (data: T) => void;
  /** Callback to run on error */
  onError?: (error: string) => void;
}

/**
 * Custom hook for managing async operations with loading, error, and data states.
 *
 * Handles the common pattern of:
 * - Setting loading state before async call
 * - Storing data on success
 * - Storing error message on failure
 * - Resetting loading state when done
 *
 * @template T - The type of data returned by the async function
 * @param asyncFn - The async function to execute
 * @param options - Configuration options
 * @returns Object containing data, error, isLoading, execute, and refetch
 *
 * @example
 * ```tsx
 * const { data, error, isLoading, refetch } = useAsync(
 *   async () => await fetchUser(userId),
 *   {
 *     immediate: true,
 *     onSuccess: (user) => console.log('User loaded:', user),
 *     onError: (error) => console.error('Failed to load user:', error)
 *   }
 * );
 * ```
 */
export function useAsync<T>(
  asyncFn: () => Promise<T>,
  options?: UseAsyncOptions<T>
): UseAsyncReturn<T> {
  const { immediate = true, onSuccess, onError } = options || {};

  const [state, setState] = useState<AsyncState<T>>({
    data: null,
    error: null,
    isLoading: immediate,
  });

  const execute = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await asyncFn();
      setState({ data, error: null, isLoading: false });
      onSuccess?.(data);
      return data;
    } catch (err) {
      let errorMessage: string;

      if (err instanceof ApiClientError) {
        errorMessage = err.detail || err.message;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      } else {
        errorMessage = 'An unexpected error occurred';
      }

      setState({ data: null, error: errorMessage, isLoading: false });
      onError?.(errorMessage);
      throw err;
    }
  }, [asyncFn, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return {
    ...state,
    execute,
    refetch: execute,
  };
}

/**
 * Response type for list operations.
 */
interface ListResponse<T> {
  items: T[];
  total: number;
}

/**
 * Return type for useList hook.
 */
interface UseListReturn<T> {
  items: T[];
  total: number;
  error: string | null;
  isLoading: boolean;
  refetch: () => Promise<ListResponse<T> | undefined>;
}

/**
 * Options for useList hook.
 */
interface UseListOptions {
  /** Whether to fetch the list immediately on mount. Defaults to true. */
  immediate?: boolean;
}

/**
 * Custom hook for managing list data fetching with loading and error states.
 *
 * Specialized version of useAsync for API endpoints that return { items: T[], total: number }.
 * Automatically extracts items and total from the response.
 *
 * @template T - The type of items in the list
 * @param fetchFn - The async function that returns { items: T[], total: number }
 * @param options - Configuration options
 * @returns Object containing items, total, error, isLoading, and refetch
 *
 * @example
 * ```tsx
 * const { items: clients, isLoading, error, refetch } = useList(getClients);
 *
 * if (isLoading) return <LoadingSkeleton />;
 * if (error) return <ErrorState message={error} onRetry={refetch} />;
 * return <ClientList clients={clients} />;
 * ```
 */
export function useList<T>(
  fetchFn: () => Promise<ListResponse<T>>,
  options?: UseListOptions
): UseListReturn<T> {
  const { immediate = true } = options || {};

  const { data, isLoading, error, execute } = useAsync(fetchFn, {
    immediate,
  });

  return {
    items: data?.items ?? [],
    total: data?.total ?? 0,
    isLoading,
    error,
    refetch: execute,
  };
}
