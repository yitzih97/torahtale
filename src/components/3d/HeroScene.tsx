import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles, Stars } from "@react-three/drei";
import * as THREE from "three";

function FloatingBook() {
  const meshRef = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.3) * 0.15 + 0.3;
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
  });

  return (
    <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.8}>
      <group ref={meshRef}>
        {/* Book cover */}
        <mesh position={[0, 0, 0.06]}>
          <boxGeometry args={[1.6, 2.1, 0.08]} />
          <meshStandardMaterial color="#1a1f4e" roughness={0.3} metalness={0.4} />
        </mesh>
        {/* Pages */}
        <mesh position={[0.02, 0, 0]}>
          <boxGeometry args={[1.5, 2.0, 0.1]} />
          <meshStandardMaterial color="#faf6ee" roughness={0.9} />
        </mesh>
        {/* Back cover */}
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[1.6, 2.1, 0.04]} />
          <meshStandardMaterial color="#1a1f4e" roughness={0.3} metalness={0.4} />
        </mesh>
        {/* Gold spine */}
        <mesh position={[-0.8, 0, 0]}>
          <boxGeometry args={[0.05, 2.1, 0.2]} />
          <meshStandardMaterial color="#c9983a" roughness={0.2} metalness={0.8} />
        </mesh>
        {/* Gold detail on cover */}
        <mesh position={[0, 0.2, 0.105]}>
          <torusGeometry args={[0.25, 0.02, 16, 32]} />
          <meshStandardMaterial color="#c9983a" roughness={0.2} metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.2, 0.105]}>
          <cylinderGeometry args={[0.08, 0.08, 0.01, 6]} />
          <meshStandardMaterial color="#c9983a" roughness={0.2} metalness={0.9} />
        </mesh>
      </group>
    </Float>
  );
}

function GoldenOrbs() {
  const orbsRef = useRef<THREE.Group>(null!);
  const positions = useMemo(() =>
    Array.from({ length: 6 }, () => [
      (Math.random() - 0.5) * 5,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 3 - 2,
    ] as [number, number, number]),
  []);

  useFrame((state) => {
    orbsRef.current.children.forEach((child, i) => {
      child.position.y += Math.sin(state.clock.elapsedTime * 0.5 + i) * 0.002;
    });
  });

  return (
    <group ref={orbsRef}>
      {positions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <sphereGeometry args={[0.08 + Math.random() * 0.12, 16, 16]} />
          <MeshDistortMaterial
            color="#c9983a"
            roughness={0.1}
            metalness={1}
            distort={0.3}
            speed={2}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

export const HeroScene = () => (
  <Canvas
    camera={{ position: [0, 0, 4.5], fov: 45 }}
    style={{ position: "absolute", inset: 0 }}
    gl={{ alpha: true, antialias: true }}
  >
    <ambientLight intensity={0.4} />
    <directionalLight position={[5, 5, 5]} intensity={1} color="#c9983a" />
    <directionalLight position={[-3, 3, 2]} intensity={0.5} color="#8890c7" />
    <pointLight position={[0, 2, 3]} intensity={0.6} color="#c9983a" />

    <FloatingBook />
    <GoldenOrbs />
    <Sparkles count={40} scale={6} size={2} speed={0.4} color="#c9983a" opacity={0.5} />
    <Stars radius={50} depth={30} count={800} factor={3} saturation={0.1} fade speed={0.5} />
  </Canvas>
);
