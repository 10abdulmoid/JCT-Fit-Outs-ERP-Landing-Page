import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { buildMaterial, setBuild } from './BuildShader';

const pendantPositions: [number, number][] = [[-4, -2], [0, -2.8], [4, 0]];
const roomOutline: [number, number, number][] = [
  [-6, .03, -4], [6, .03, -4], [6, .03, 4], [-6, .03, 4], [-6, .03, -4],
];
const concrete = new THREE.Color('#465a57');
const timber = new THREE.Color('#7c6c59');

function BlueprintDrawing({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const material = useMemo(() => new THREE.LineDashedMaterial({
    color: '#5088d7', transparent: true, opacity: .28, dashSize: .2, gapSize: .1, depthWrite: false,
  }), []);
  const gridGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let x = -6; x <= 6; x += 1) points.push(new THREE.Vector3(x, .015, -4), new THREE.Vector3(x, .015, 4));
    for (let z = -4; z <= 4; z += 1) points.push(new THREE.Vector3(-6, .015, z), new THREE.Vector3(6, .015, z));
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);
  const outlineGeometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(
    roomOutline.map((point) => new THREE.Vector3(...point)),
  ), []);
  const grid = useMemo(() => {
    const lines = new THREE.LineSegments(gridGeometry, material);
    lines.computeLineDistances();
    return lines;
  }, [gridGeometry, material]);
  const outline = useMemo(() => {
    const line = new THREE.Line(outlineGeometry, material);
    line.computeLineDistances();
    return line;
  }, [outlineGeometry, material]);

  useEffect(() => () => {
    gridGeometry.dispose();
    outlineGeometry.dispose();
    material.dispose();
  }, [gridGeometry, outlineGeometry, material]);

  useFrame(() => {
    const progress = THREE.MathUtils.clamp(progressRef.current, 0, 1);
    gridGeometry.setDrawRange(0, Math.floor(progress * gridGeometry.attributes.position.count / 2) * 2);
    outlineGeometry.setDrawRange(0, Math.min(
      outlineGeometry.attributes.position.count,
      Math.ceil(progress * (outlineGeometry.attributes.position.count - 1)) + 1,
    ));
    material.gapSize = (1 - progress) * .1;
    material.opacity = .12 + progress * .17;
  });

  return <><primitive object={grid} /><primitive object={outline} /></>;
}

function PendantLight({ insideRef, index }: { insideRef: MutableRefObject<number>; index: number }) {
  const material = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  useFrame(() => {
    const glow = THREE.MathUtils.clamp((insideRef.current - index * .16) * 2.6, 0, 1);
    if (material.current) material.current.emissiveIntensity = glow * .8;
    if (light.current) light.current.intensity = glow * .45;
  });
  return <>
    <mesh position={[0, -.42, 0]}><sphereGeometry args={[.18, 10, 8]} /><meshStandardMaterial ref={material} color="#f3c58f" emissive="#f9a95c" emissiveIntensity={0} /></mesh>
    <pointLight ref={light} position={[0, -.4, 0]} color="#ffd39a" intensity={0} distance={3.4} />
  </>;
}

function Wall({ position, size, buildRef, blueprintRef, color = '#a8c9ff' }: { position: [number, number, number]; size: [number, number, number]; buildRef: MutableRefObject<number>; blueprintRef: MutableRefObject<number>; color?: string }) {
  const mat = useMemo(() => buildMaterial(color), [color]);
  const wallRef = useRef<THREE.Group>(null);
  useFrame(() => {
    const delay = (Math.abs(position[0]) + Math.abs(position[2])) * .018;
    const build = THREE.MathUtils.clamp((buildRef.current - delay) / (1 - delay), 0, 1);
    if (wallRef.current) wallRef.current.scale.y = build;
    setBuild(mat, build);
    const lineProgress = Math.max(blueprintRef.current, build);
    const vertexCount = edge.geometry.attributes.position.count;
    edge.geometry.setDrawRange(0, Math.floor(lineProgress * vertexCount / 2) * 2);
    const lineMaterial = edge.material as THREE.LineDashedMaterial;
    lineMaterial.gapSize = (1 - lineProgress) * .12;
    lineMaterial.opacity = .3 + lineProgress * .58;
  });
  const edge = useMemo(() => {
    const source = new THREE.BoxGeometry(...size);
    const geo = new THREE.EdgesGeometry(source);
    source.dispose();
    const line = new THREE.LineSegments(geo, new THREE.LineDashedMaterial({
      color: '#72aaff', transparent: true, opacity: .88, dashSize: .22, gapSize: .12,
    }));
    line.computeLineDistances();
    return line;
  }, [size]);
  useEffect(() => () => {
    edge.geometry.dispose();
    (edge.material as THREE.Material).dispose();
  }, [edge]);
  useEffect(() => () => mat.dispose(), [mat]);
  return <>
    <group ref={wallRef} position={[position[0], 0, position[2]]}>
      <mesh position={[0, size[1] / 2, 0]} material={mat}>
        <boxGeometry args={size} />
      </mesh>
    </group>
    <primitive object={edge} position={[position[0], size[1] / 2, position[2]]} />
  </>;
}

export function FloorPlan({ buildRef, blueprintRef, insideRef, explodeRef }: { buildRef: MutableRefObject<number>; blueprintRef: MutableRefObject<number>; insideRef: MutableRefObject<number>; explodeRef: MutableRefObject<number> }) {
  const meshMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#465a57', roughness: .94, metalness: .02 }), []);
  const floorRef = useRef<THREE.Mesh>(null);
  const roomRef = useRef<THREE.Group>(null);
  const furnitureRef = useRef<THREE.Group>(null);
  const chairRef = useRef<THREE.InstancedMesh>(null);
  useEffect(() => () => meshMat.dispose(), [meshMat]);
  useEffect(() => {
    if (!chairRef.current) return;
    const positions: [number, number, number][] = [[-2.5, .24, -2.6], [-1.4, .24, -2.6], [-2.5, .24, -1.6], [-1.4, .24, -1.6]];
    const matrix = new THREE.Matrix4();
    positions.forEach((position, index) => {
      matrix.makeTranslation(...position);
      chairRef.current?.setMatrixAt(index, matrix);
    });
    chairRef.current.instanceMatrix.needsUpdate = true;
  }, []);
  useFrame(() => {
    const build = buildRef.current;
    if (floorRef.current) {
      const material = floorRef.current.material as THREE.MeshStandardMaterial;
      material.color.lerpColors(concrete, timber, insideRef.current * .75);
    }
    if (roomRef.current) roomRef.current.scale.setScalar(1 + explodeRef.current * .24);
    if (furnitureRef.current) furnitureRef.current.scale.setScalar(build);
  });
  return (
    <group position={[0, -1.1, 0]}>
      <group ref={roomRef} position={[0, 0, 0]}>
        <mesh ref={floorRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} material={meshMat}>
          <planeGeometry args={[12, 8]} />
        </mesh>
        <BlueprintDrawing progressRef={blueprintRef} />
        <Wall position={[0, 1.4, -4]} size={[12, 2.8, .12]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <Wall position={[-6, 1.4, 0]} size={[.12, 2.8, 8]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <Wall position={[6, 1.4, 0]} size={[.12, 2.8, 8]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <Wall position={[0, 1.4, 4]} size={[4.5, 2.8, .12]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <Wall position={[-3.7, 1.4, 0]} size={[.12, 2.8, 8]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <Wall position={[2.5, 1.4, 0]} size={[.12, 2.8, 5.7]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <Wall position={[0, 1.4, -1.8]} size={[6, 2.8, .12]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <group ref={furnitureRef} position={[0, 0, 0]}>
          <instancedMesh ref={chairRef} args={[undefined, undefined, 4]} castShadow>
            <boxGeometry args={[.38, .46, .38]} />
            <meshStandardMaterial color="#536d82" roughness={.8} />
          </instancedMesh>
          <mesh position={[-4.65, .48, -2.3]}><boxGeometry args={[1.6, .55, .8]} /><meshStandardMaterial color="#836750" roughness={.8} /></mesh>
          <mesh position={[-4.65, .82, -2.3]}><boxGeometry args={[1.6, .12, .8]} /><meshStandardMaterial color="#c1c5bd" /></mesh>
          <mesh position={[4.6, .42, 2.6]}><boxGeometry args={[1.2, .5, 1.25]} /><meshStandardMaterial color="#a17c60" roughness={.72} /></mesh>
          <mesh position={[1.2, .52, -2.8]}><boxGeometry args={[1.8, .08, .85]} /><meshStandardMaterial color="#c6bba9" /></mesh>
          {pendantPositions.map(([x, z], i) => (
            <group key={i} position={[x, 2.55, z]}>
              <mesh><cylinderGeometry args={[.03, .03, .7, 8]} /><meshStandardMaterial color="#bdc9d1" /></mesh>
              <PendantLight insideRef={insideRef} index={i} />
            </group>
          ))}
        </group>
      </group>
    </group>
  );
}