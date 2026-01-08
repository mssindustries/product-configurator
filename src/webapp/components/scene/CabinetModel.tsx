'use client';

import { useEffect, useRef } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useConfiguration } from '@/context/ConfigurationContext';
import { createMaterial } from '@/lib/materials';

export default function CabinetModel() {
  const { configuration } = useConfiguration();
  const { color, material, dimensions } = configuration;
  const groupRef = useRef<THREE.Group>(null);

  const gltf = useGLTF('/models/cabinet.glb');

  useEffect(() => {
    if (!gltf.scene) return;

    gltf.scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const newMaterial = createMaterial(material, color);
        child.material = newMaterial;
      }
    });
  }, [gltf.scene, material, color]);

  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.scale.set(dimensions.width, dimensions.height, dimensions.depth);
    }
  }, [dimensions]);

  return (
    <group ref={groupRef}>
      <primitive object={gltf.scene} />
    </group>
  );
}

useGLTF.preload('/models/cabinet.glb');
