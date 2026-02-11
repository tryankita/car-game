import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import Car3D from './Car3D';

export default function GameCanvas() {
  return (
    <Canvas camera={{ position: [5, 5, 10], fov: 60 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} />
      <Car3D />
      <OrbitControls />
    </Canvas>
  );
}
