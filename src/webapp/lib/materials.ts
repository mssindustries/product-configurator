import * as THREE from 'three';
import type { MaterialType } from '@/types/configurator';

export function getMaterialProperties(type: MaterialType) {
  switch (type) {
    case 'wood':
      return {
        roughness: 0.8,
        metalness: 0.1,
        type: 'standard' as const,
      };
    case 'metal':
      return {
        roughness: 0.3,
        metalness: 0.9,
        type: 'standard' as const,
      };
    case 'glass':
      return {
        roughness: 0.1,
        metalness: 0.0,
        transmission: 0.9,
        transparent: true,
        opacity: 0.5,
        type: 'physical' as const,
      };
    case 'plastic':
      return {
        roughness: 0.5,
        metalness: 0.0,
        type: 'standard' as const,
      };
  }
}

export function createMaterial(type: MaterialType, color: string) {
  const props = getMaterialProperties(type);

  if (props.type === 'physical') {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color),
      roughness: props.roughness,
      metalness: props.metalness,
      transmission: props.transmission,
      transparent: props.transparent,
      opacity: props.opacity,
    });
  }

  return new THREE.MeshStandardMaterial({
    color: new THREE.Color(color),
    roughness: props.roughness,
    metalness: props.metalness,
  });
}
