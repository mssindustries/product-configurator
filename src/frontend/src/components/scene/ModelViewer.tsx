/**
 * GLB model viewer with loading and error states.
 */

import { Suspense } from 'react';
import { useGLTF } from '@react-three/drei';
import { ErrorBoundary, type FallbackProps } from 'react-error-boundary';

interface ModelProps {
  url: string;
}

/**
 * Internal component that loads and renders the GLB model.
 */
function Model({ url }: ModelProps) {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
}

/**
 * Loading placeholder - spinning box.
 */
function LoadingPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#666" wireframe />
    </mesh>
  );
}

/**
 * Error placeholder - red box with message.
 */
function ErrorPlaceholder() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#ff4444" />
    </mesh>
  );
}

/**
 * Error boundary fallback for 3D scene.
 */
function ModelErrorFallback({ error }: FallbackProps) {
  console.error('Model loading error:', error);
  return <ErrorPlaceholder />;
}

export interface ModelViewerProps {
  /** URL to the GLB file */
  url: string;
  /** Optional callback when model loads successfully */
  onLoad?: () => void;
  /** Optional callback when model fails to load */
  onError?: (error: unknown) => void;
}

/**
 * Model viewer component with loading and error handling.
 *
 * Usage:
 * ```tsx
 * <ModelViewer url="https://example.com/model.glb" />
 * ```
 */
export function ModelViewer({ url, onError }: ModelViewerProps) {
  return (
    <ErrorBoundary
      FallbackComponent={ModelErrorFallback}
      onError={onError}
      resetKeys={[url]}
    >
      <Suspense fallback={<LoadingPlaceholder />}>
        <Model url={url} />
      </Suspense>
    </ErrorBoundary>
  );
}

/**
 * Preload a GLB model for faster loading.
 */
export function preloadModel(url: string) {
  useGLTF.preload(url);
}
