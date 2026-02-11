import { useGLTF } from '@react-three/drei';

export default function Car3D() {
  const { scene } = useGLTF('/models/drunk_monster_truck.glb');

  return (
    <primitive
      object={scene}
      scale={0.5}
      position={[0, 0, 0]}
    />
  );
}
