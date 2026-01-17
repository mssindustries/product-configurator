/**
 * 3D scene with canvas, camera, and controls.
 */

import { ReactNode } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { Lights } from './Lights';

export interface Scene3DProps {
  /** Content to render in the scene */
  children: ReactNode;
  /** Background color (default: #f0f0f0) */
  backgroundColor?: string;
  /** Enable shadows (default: true) */
  shadows?: boolean;
  /** Show environment reflections (default: true) */
  showEnvironment?: boolean;
  /** Camera field of view (default: 50) */
  fov?: number;
  /** Camera position (default: [5, 3, 5]) */
  cameraPosition?: [number, number, number];
}

/**
 * 3D scene container with camera, lighting, and controls.
 *
 * Usage:
 * ```tsx
 * <Scene3D>
 *   <ModelViewer url="https://example.com/model.glb" />
 * </Scene3D>
 * ```
 */
export function Scene3D({
  children,
  backgroundColor = '#f0f0f0',
  shadows = true,
  showEnvironment = true,
  fov = 50,
  cameraPosition = [5, 3, 5],
}: Scene3DProps) {
  return (
    <Canvas
      shadows={shadows}
      camera={{
        position: cameraPosition,
        fov,
        near: 0.1,
        far: 1000,
      }}
      style={{ background: backgroundColor }}
    >
      {/* Lighting */}
      <Lights />

      {/* Environment for reflections */}
      {showEnvironment && (
        <Environment preset="studio" />
      )}

      {/* Camera controls */}
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={1}
        maxDistance={50}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
      />

      {/* Scene content */}
      {children}
    </Canvas>
  );
}
