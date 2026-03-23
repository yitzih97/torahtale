import { useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";

function ScrollStack() {
  const groupRef = useRef<THREE.Group>(null!);

  useFrame((state) => {
    groupRef.current.rotation.y = state.clock.elapsedTime * 0.15;
  });

  const scrollColors = ["#1a1f4e", "#2d3470", "#c9983a", "#1a1f4e", "#3d4590"];

  return (
    <Float speed={1} rotationIntensity={0.2} floatIntensity={0.5}>
      <group ref={groupRef}>
        {scrollColors.map((color, i) => (
          <mesh key={i} position={[0, (i - 2) * 0.45, 0]} rotation={[0, i * 0.2, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 0.08, 32]} />
            <meshStandardMaterial
              color={color}
              roughness={0.25}
              metalness={0.6}
              transparent
              opacity={0.85}
            />
          </mesh>
        ))}
        {/* Central golden core */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.2, 32, 32]} />
          <MeshDistortMaterial
            color="#c9983a"
            roughness={0.1}
            metalness={1}
            distort={0.4}
            speed={3}
          />
        </mesh>
      </group>
    </Float>
  );
}

export const GalleryScene = () => (
  <Canvas
    camera={{ position: [0, 0, 4], fov: 45 }}
    style={{ width: "100%", height: "100%" }}
    gl={{ alpha: true, antialias: true }}
  >
    <ambientLight intensity={0.4} />
    <directionalLight position={[3, 4, 5]} intensity={1} color="#c9983a" />
    <directionalLight position={[-3, 2, 2]} intensity={0.4} color="#8890c7" />
    <ScrollStack />
    <Sparkles count={30} scale={5} size={2} speed={0.3} color="#c9983a" opacity={0.4} />
  </Canvas>
);
