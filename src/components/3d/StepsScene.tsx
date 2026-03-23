import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial, Sparkles } from "@react-three/drei";
import * as THREE from "three";

function StepSphere({ position, color, scale = 1 }: { position: [number, number, number]; color: string; scale?: number }) {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    ref.current.rotation.y = state.clock.elapsedTime * 0.3;
    ref.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
  });

  return (
    <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={ref} position={position} scale={scale}>
        <icosahedronGeometry args={[0.6, 1]} />
        <MeshDistortMaterial color={color} roughness={0.15} metalness={0.7} distort={0.35} speed={3} />
      </mesh>
    </Float>
  );
}

function ConnectingLine() {
  const ref = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    if (ref.current) {
      const mat = ref.current.material as THREE.MeshStandardMaterial;
      mat.opacity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
    }
  });

  const curve = useMemo(() => {
    return new THREE.CatmullRomCurve3([
      new THREE.Vector3(-2.8, 0, 0),
      new THREE.Vector3(-1, 0.3, 0.5),
      new THREE.Vector3(1, -0.3, -0.5),
      new THREE.Vector3(2.8, 0, 0),
    ]);
  }, []);

  const geometry = useMemo(() => {
    return new THREE.TubeGeometry(curve, 64, 0.015, 8, false);
  }, [curve]);

  return (
    <mesh ref={ref} geometry={geometry}>
      <meshStandardMaterial color="#c9983a" transparent opacity={0.4} metalness={0.8} roughness={0.2} />
    </mesh>
  );
}

export const StepsScene = () => (
  <Canvas
    camera={{ position: [0, 0, 5], fov: 50 }}
    style={{ width: "100%", height: "100%" }}
    gl={{ alpha: true, antialias: true }}
  >
    <ambientLight intensity={0.5} />
    <directionalLight position={[5, 5, 5]} intensity={0.8} color="#c9983a" />
    <pointLight position={[-2, 2, 3]} intensity={0.4} color="#8890c7" />

    <StepSphere position={[-2.8, 0, 0]} color="#1a1f4e" scale={0.9} />
    <StepSphere position={[0, 0, 0]} color="#c9983a" scale={1} />
    <StepSphere position={[2.8, 0, 0]} color="#2d3470" scale={0.9} />
    <ConnectingLine />
    <Sparkles count={20} scale={8} size={1.5} speed={0.3} color="#c9983a" opacity={0.3} />
  </Canvas>
);
