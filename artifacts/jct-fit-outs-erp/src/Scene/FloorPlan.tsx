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

function CeilingBeams({ buildRef, blueprintRef }: { buildRef: MutableRefObject<number>; blueprintRef: MutableRefObject<number> }) {
  const beamMat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#2b3d4f', roughness: .7, metalness: .3 }), []);
  useEffect(() => () => beamMat.dispose(), [beamMat]);
  return (
    <group position={[0, 2.72, 0]}>
      {[-3.6, -1.2, 1.2, 3.6].map((x, i) => (
        <mesh key={i} position={[x, 0, 0]} material={beamMat}>
          <boxGeometry args={[.16, .18, 8]} />
        </mesh>
      ))}
      {[-2, 0, 2].map((z, i) => (
        <mesh key={`cross-${i}`} position={[0, -.02, z]} material={beamMat}>
          <boxGeometry args={[12, .14, .16]} />
        </mesh>
      ))}
    </group>
  );
}

function WindowOpening({ position, size }: { position: [number, number, number]; size: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Frame */}
      <mesh><boxGeometry args={size} /><meshStandardMaterial color="#2d4052" roughness={.5} metalness={.4} wireframe /></mesh>
      {/* Glass Pane */}
      <mesh><boxGeometry args={[size[0] * .96, size[1] * .92, .02]} /><meshStandardMaterial color="#8abaff" transparent opacity={.25} roughness={.1} metalness={.9} /></mesh>
    </group>
  );
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
    const positions: [number, number, number][] = [[-2.5, .24, -2.6], [-1.4, .24, -2.6], [-2.5, .24, -1.6], [-1.4, .24, -1.6], [1.2, .24, 2.2], [2.2, .24, 2.2]];
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

        {/* Outer Back Wall (Z = -4) with Window Openings */}
        <Wall position={[-4, 1.4, -4]} size={[4, 2.8, .12]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <Wall position={[4, 1.4, -4]} size={[4, 2.8, .12]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <Wall position={[0, 2.3, -4]} size={[4, 1.0, .12]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <Wall position={[0, .4, -4]} size={[4, .8, .12]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <WindowOpening position={[0, 1.5, -4]} size={[3.8, 1.0, .08]} />

        {/* Outer Left Wall (X = -6) */}
        <Wall position={[-6, 1.4, 0]} size={[.12, 2.8, 8]} buildRef={buildRef} blueprintRef={blueprintRef} />

        {/* Outer Right Wall (X = 6) with Window Openings */}
        <Wall position={[6, 1.4, -2.5]} size={[.12, 2.8, 3]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <Wall position={[6, 1.4, 2.5]} size={[.12, 2.8, 3]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <Wall position={[6, 2.3, 0]} size={[.12, 1.0, 2]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <Wall position={[6, .4, 0]} size={[.12, .8, 2]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <WindowOpening position={[6, 1.5, 0]} size={[.08, 1.0, 1.8]} />

        {/* Front Wall (Z = 4) with Main Entrance Doorway Gap [X: -1 to 1] */}
        <Wall position={[-3.5, 1.4, 4]} size={[5, 2.8, .12]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <Wall position={[3.5, 1.4, 4]} size={[5, 2.8, .12]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <Wall position={[0, 2.4, 4]} size={[2, .8, .12]} buildRef={buildRef} blueprintRef={blueprintRef} />

        {/* Partition Wall 1 (X = -3.7) with Interior Doorway Gap [Z: -0.8 to 0.8] */}
        <Wall position={[-3.7, 1.4, -2.5]} size={[.12, 2.8, 3]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <Wall position={[-3.7, 1.4, 2.5]} size={[.12, 2.8, 3]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <Wall position={[-3.7, 2.4, 0]} size={[.12, .8, 1.6]} buildRef={buildRef} blueprintRef={blueprintRef} />

        {/* Partition Wall 2 (X = 2.5) with Interior Doorway Gap [Z: -1 to 0] */}
        <Wall position={[2.5, 1.4, -2.4]} size={[.12, 2.8, .9]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <Wall position={[2.5, 1.4, 1.35]} size={[.12, 2.8, 3.0]} buildRef={buildRef} blueprintRef={blueprintRef} />
        <Wall position={[2.5, 2.4, -.5]} size={[.12, .8, 1.0]} buildRef={buildRef} blueprintRef={blueprintRef} />

        {/* Partition Wall 3 (Z = -1.8) */}
        <Wall position={[0, 1.4, -1.8]} size={[5, 2.8, .12]} buildRef={buildRef} blueprintRef={blueprintRef} />

        {/* Ceiling Beams */}
        <CeilingBeams buildRef={buildRef} blueprintRef={blueprintRef} />

        {/* Expanded Fit-Out Furniture & Interiors */}
        <group ref={furnitureRef} position={[0, 0, 0]}>
          <instancedMesh ref={chairRef} args={[undefined, undefined, 6]} castShadow>
            <boxGeometry args={[.38, .46, .38]} />
            <meshStandardMaterial color="#536d82" roughness={.8} />
          </instancedMesh>

          {/* Meeting Room Table & Credenza */}
          <mesh position={[-4.65, .48, -2.3]}><boxGeometry args={[1.6, .55, .8]} /><meshStandardMaterial color="#836750" roughness={.8} /></mesh>
          <mesh position={[-4.65, .82, -2.3]}><boxGeometry args={[1.6, .12, .8]} /><meshStandardMaterial color="#c1c5bd" /></mesh>

          {/* Workstations with Monitors */}
          <mesh position={[1.7, .52, 2.2]}><boxGeometry args={[2.0, .08, .9]} /><meshStandardMaterial color="#3a4b5c" /></mesh>
          <mesh position={[1.4, .78, 2.2]}><boxGeometry args={[.06, .35, .5]} /><meshStandardMaterial color="#1a202c" /></mesh>
          <mesh position={[2.0, .78, 2.2]}><boxGeometry args={[.06, .35, .5]} /><meshStandardMaterial color="#1a202c" /></mesh>

          {/* Reception Desk & Lounge Sofa */}
          <mesh position={[0, .5, 2.8]}><boxGeometry args={[2.2, .9, .6]} /><meshStandardMaterial color="#2d3748" roughness={.4} /></mesh>
          <mesh position={[0, .98, 2.8]}><boxGeometry args={[2.3, .08, .65]} /><meshStandardMaterial color="#c4845a" roughness={.5} /></mesh>

          <mesh position={[-1.8, .35, 1.2]}><boxGeometry args={[1.8, .45, .8]} /><meshStandardMaterial color="#334155" roughness={.8} /></mesh>
          <mesh position={[-1.8, .22, .5]}><boxGeometry args={[1.0, .28, .5]} /><meshStandardMaterial color="#a17c60" roughness={.7} /></mesh>

          {/* Executive Desk */}
          <mesh position={[4.6, .42, 2.6]}><boxGeometry args={[1.2, .5, 1.25]} /><meshStandardMaterial color="#a17c60" roughness={.72} /></mesh>
          <mesh position={[1.2, .52, -2.8]}><boxGeometry args={[1.8, .08, .85]} /><meshStandardMaterial color="#c6bba9" /></mesh>

          {/* Indoor Planters */}
          <group position={[-5.3, .3, 3.2]}>
            <mesh><cylinderGeometry args={[.25, .2, .5, 12]} /><meshStandardMaterial color="#475569" /></mesh>
            <mesh position={[0, .45, 0]}><sphereGeometry args={[.35, 8, 8]} /><meshStandardMaterial color="#2d5a3f" roughness={.9} /></mesh>
          </group>
          <group position={[5.2, .3, -3.2]}>
            <mesh><cylinderGeometry args={[.25, .2, .5, 12]} /><meshStandardMaterial color="#475569" /></mesh>
            <mesh position={[0, .45, 0]}><sphereGeometry args={[.35, 8, 8]} /><meshStandardMaterial color="#2d5a3f" roughness={.9} /></mesh>
          </group>

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