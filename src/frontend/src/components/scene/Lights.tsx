/**
 * Lighting setup for 3D scene.
 */

export function Lights() {
  return (
    <>
      {/* Ambient light for base illumination */}
      <ambientLight intensity={0.4} />

      {/* Main directional light (sun-like) */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={50}
        shadow-camera-left={-10}
        shadow-camera-right={10}
        shadow-camera-top={10}
        shadow-camera-bottom={-10}
      />

      {/* Fill light from opposite side */}
      <directionalLight
        position={[-5, 5, -5]}
        intensity={0.3}
      />

      {/* Soft light from below for product visibility */}
      <hemisphereLight
        args={['#ffffff', '#444444', 0.5]}
      />
    </>
  );
}
