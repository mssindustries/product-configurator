'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import CabinetModel from './CabinetModel';
import Lights from './Lights';

export default function Scene3D() {
  return (
    <Canvas
      camera={{ position: [5, 5, 5], fov: 50 }}
      className="bg-gradient-to-b from-gray-100 to-gray-200"
    >
      <Lights />
      <CabinetModel />
      <OrbitControls enableDamping dampingFactor={0.05} />
    </Canvas>
  );
}
