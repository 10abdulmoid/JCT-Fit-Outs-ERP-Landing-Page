import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { buildMaterial, setBuild } from './BuildShader';

// Named constants for floor plan geometry
export const FLOOR_HEIGHT = -1.1;
export const WALL_HEIGHT = 2.8;
export const COPPER_COLOR = '#C4845A';
export const TEAL_COLOR = '#2DD4BF';
export const WALL_COLOR = '#88c0ff';
export const WOOD_COLOR = '#8a6e53';
export const TILE_COLOR = '#cfd8dc';

function BlueprintDrawing({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const material = useMemo(
    () =>
      new THREE.LineDashedMaterial({
        color: '#5088d7',
        transparent: true,
        opacity: 0.28,
        dashSize: 0.2,
        gapSize: 0.1,
        depthWrite: false,
      }),
    []
  );

  const gridGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    for (let x = -6; x <= 6; x += 1) {
      points.push(new THREE.Vector3(x, 0.015, -4), new THREE.Vector3(x, 0.015, 4));
    }
    for (let z = -4; z <= 4; z += 1) {
      points.push(new THREE.Vector3(-6, 0.015, z), new THREE.Vector3(6, 0.015, z));
    }
    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  const roomOutlinePoints: [number, number, number][] = [
    [-6, 0.03, -4],
    [6, 0.03, -4],
    [6, 0.03, 4],
    [-6, 0.03, 4],
    [-6, 0.03, -4],
  ];

  const outlineGeometry = useMemo(
    () =>
      new THREE.BufferGeometry().setFromPoints(
        roomOutlinePoints.map((point) => new THREE.Vector3(...point))
      ),
    []
  );

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

  useEffect(
    () => () => {
      gridGeometry.dispose();
      outlineGeometry.dispose();
      material.dispose();
    },
    [gridGeometry, outlineGeometry, material]
  );

  useFrame(() => {
    const progress = THREE.MathUtils.clamp(progressRef.current, 0, 1);
    gridGeometry.setDrawRange(0, Math.floor((progress * gridGeometry.attributes.position.count) / 2) * 2);
    outlineGeometry.setDrawRange(
      0,
      Math.min(
        outlineGeometry.attributes.position.count,
        Math.ceil(progress * (outlineGeometry.attributes.position.count - 1)) + 1
      )
    );
    material.gapSize = (1 - progress) * 0.1;
    material.opacity = 0.12 + progress * 0.17;
  });

  return (
    <>
      <primitive object={grid} />
      <primitive object={outline} />
    </>
  );
}

function Wall({
  position,
  size,
  buildRef,
  blueprintRef,
  explodeRef,
  color = WALL_COLOR,
}: {
  position: [number, number, number];
  size: [number, number, number];
  buildRef: MutableRefObject<number>;
  blueprintRef: MutableRefObject<number>;
  explodeRef?: MutableRefObject<number>;
  color?: string;
}) {
  const mat = useMemo(() => buildMaterial(color, 0.85, 0.05), [color]);
  const wallRef = useRef<THREE.Group>(null);

  const edge = useMemo(() => {
    const source = new THREE.BoxGeometry(...size);
    const geo = new THREE.EdgesGeometry(source);
    source.dispose();
    const line = new THREE.LineSegments(
      geo,
      new THREE.LineDashedMaterial({
        color: '#72aaff',
        transparent: true,
        opacity: 0.88,
        dashSize: 0.22,
        gapSize: 0.12,
      })
    );
    line.computeLineDistances();
    return line;
  }, [size]);

  useEffect(
    () => () => {
      edge.geometry.dispose();
      (edge.material as THREE.Material).dispose();
      mat.dispose();
    },
    [edge, mat]
  );

  useFrame(() => {
    // Distance stagger relative to entry door at (5, 4)
    const dist = Math.hypot(position[0] - 5, position[2] - 4);
    const delay = dist * 0.035;
    const build = THREE.MathUtils.clamp((buildRef.current - delay) / Math.max(0.01, 1 - delay), 0, 1);
    const explode = explodeRef ? explodeRef.current : 0;

    if (wallRef.current) {
      wallRef.current.scale.y = THREE.MathUtils.lerp(build, 0.35 * build, explode);
    }
    setBuild(mat, build);
    mat.opacity = THREE.MathUtils.lerp(0.22, 0.08, explode);

    const lineProgress = Math.max(blueprintRef.current, build);
    const vertexCount = edge.geometry.attributes.position.count;
    edge.geometry.setDrawRange(0, Math.floor((lineProgress * vertexCount) / 2) * 2);
    const lineMaterial = edge.material as THREE.LineDashedMaterial;
    lineMaterial.gapSize = (1 - lineProgress) * 0.12;
    lineMaterial.opacity = THREE.MathUtils.lerp(0.3 + lineProgress * 0.58, 0.15, explode);
  });

  return (
    <>
      <group ref={wallRef} position={[position[0], 0, position[2]]}>
        <mesh position={[0, size[1] / 2, 0]} material={mat}>
          <boxGeometry args={size} />
        </mesh>
      </group>
      <primitive object={edge} position={[position[0], size[1] / 2, position[2]]} />
    </>
  );
}

export function FloorPlan({
  buildRef,
  blueprintRef,
  insideRef,
  explodeRef,
}: {
  buildRef: MutableRefObject<number>;
  blueprintRef: MutableRefObject<number>;
  insideRef: MutableRefObject<number>;
  explodeRef: MutableRefObject<number>;
}) {
  const isMobile =
    typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches;

  // Materials
  const woodMat = useMemo(() => buildMaterial(WOOD_COLOR, 0.7, 0.1), []);
  const tileMat = useMemo(() => buildMaterial(TILE_COLOR, 0.4, 0.2), []);
  const furnitureMat = useMemo(() => buildMaterial('#546e7a', 0.8, 0.1), []);
  const copperMat = useMemo(() => buildMaterial(COPPER_COLOR, 0.5, 0.6), []);
  const tealMat = useMemo(() => buildMaterial(TEAL_COLOR, 0.5, 0.2), []);
  const whiteMat = useMemo(() => buildMaterial('#e2e8f0', 0.9, 0.05), []);
  const glassMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#a5f3fc',
        transparent: true,
        opacity: 0.35,
        roughness: 0.1,
      }),
    []
  );

  const roomRef = useRef<THREE.Group>(null);
  const furnitureRef = useRef<THREE.Group>(null);

  // Instanced Meshes for repeated items
  const diningChairsRef = useRef<THREE.InstancedMesh>(null);
  const stoolRef = useRef<THREE.InstancedMesh>(null);
  const cabinetDoorsRef = useRef<THREE.InstancedMesh>(null);

  useEffect(() => {
    // 4 Dining Chairs in Living area
    if (diningChairsRef.current) {
      const positions: [number, number, number][] = [
        [-2.3, 0.23, 2.7],
        [-1.3, 0.23, 2.7],
        [-2.3, 0.23, 1.7],
        [-1.3, 0.23, 1.7],
      ];
      const mat = new THREE.Matrix4();
      positions.forEach((pos, idx) => {
        mat.makeTranslation(...pos);
        diningChairsRef.current?.setMatrixAt(idx, mat);
      });
      diningChairsRef.current.instanceMatrix.needsUpdate = true;
    }

    // 2 Island Stools in Kitchen
    if (stoolRef.current) {
      const positions: [number, number, number][] = [
        [1.8, 0.35, 1.2],
        [2.6, 0.35, 1.2],
      ];
      const mat = new THREE.Matrix4();
      positions.forEach((pos, idx) => {
        mat.makeTranslation(...pos);
        stoolRef.current?.setMatrixAt(idx, mat);
      });
      stoolRef.current.instanceMatrix.needsUpdate = true;
    }

    // Overhead cabinet doors in Kitchen
    if (cabinetDoorsRef.current) {
      const positions: [number, number, number][] = [
        [0.85, 2.1, 3.75],
        [1.55, 2.1, 3.75],
        [2.25, 2.1, 3.75],
        [2.95, 2.1, 3.75],
        [3.65, 2.1, 3.75],
      ];
      const mat = new THREE.Matrix4();
      positions.forEach((pos, idx) => {
        mat.makeTranslation(...pos);
        cabinetDoorsRef.current?.setMatrixAt(idx, mat);
      });
      cabinetDoorsRef.current.instanceMatrix.needsUpdate = true;
    }
  }, []);

  useEffect(
    () => () => {
      woodMat.dispose();
      tileMat.dispose();
      furnitureMat.dispose();
      copperMat.dispose();
      tealMat.dispose();
      whiteMat.dispose();
      glassMat.dispose();
    },
    [woodMat, tileMat, furnitureMat, copperMat, tealMat, whiteMat, glassMat]
  );

  const [activeStepIndex, setActiveStepIndex] = useState(-1);
  const activeLabelGroup = useRef<THREE.Group>(null);

  // Room centers & dimensions for active outlines and lights
  const roomMeta = [
    { name: 'Lead: Entry Foyer', center: [5.0, 2.0] as [number, number], size: [2.0, 4.0] as [number, number] },
    { name: 'Site Visit: Kitchen', center: [2.25, 2.0] as [number, number], size: [3.5, 4.0] as [number, number] },
    { name: 'BOQ: Living & Dining', center: [-2.75, 2.0] as [number, number], size: [6.5, 4.0] as [number, number] },
    { name: 'Client Approval: Master Bedroom', center: [-3.75, -2.0] as [number, number], size: [4.5, 4.0] as [number, number] },
    { name: 'Schedule: Bathroom', center: [-0.5, -2.0] as [number, number], size: [2.0, 4.0] as [number, number] },
    { name: 'Billing: Bedroom 2', center: [2.0, -2.0] as [number, number], size: [3.0, 4.0] as [number, number] },
  ];

  const lightRefs = useRef<(THREE.PointLight | null)[]>([]);

  useFrame(() => {
    const build = buildRef.current;
    [woodMat, tileMat, furnitureMat, copperMat, tealMat, whiteMat].forEach((m) =>
      setBuild(m, build)
    );

    if (roomRef.current) {
      roomRef.current.scale.setScalar(1 + explodeRef.current * 0.24);
    }
    if (furnitureRef.current) {
      furnitureRef.current.scale.setScalar(build);
    }

    const inside = insideRef.current;
    const currentStep = inside > 0 && inside <= 1 ? Math.min(5, Math.max(0, Math.floor(inside * 6))) : -1;
    if (currentStep !== activeStepIndex) {
      setActiveStepIndex(currentStep);
    }

    // Dynamic light ramps warm #ffd9a8
    roomMeta.forEach((_, idx) => {
      const light = lightRefs.current[idx];
      if (light) {
        const isLit = inside > 0 && currentStep >= idx;
        light.intensity = THREE.MathUtils.lerp(light.intensity, isLit ? 2.8 : 0, 0.1);
      }
    });
  });

  return (
    <group position={[0, FLOOR_HEIGHT, 0]}>
      {/* Active Room Lights & Labels */}
      {roomMeta.map((rm, idx) => (
        <group key={rm.name} position={[rm.center[0], 2.2, rm.center[1]]}>
          <pointLight
            ref={(el) => (lightRefs.current[idx] = el)}
            color="#ffd9a8"
            intensity={0}
            distance={5.5}
            decay={2}
          />
        </group>
      ))}

      {/* Active Room Label in R3F */}
      {activeStepIndex >= 0 && activeStepIndex < roomMeta.length && (
        <Html
          position={[roomMeta[activeStepIndex].center[0], 2.4, roomMeta[activeStepIndex].center[1]]}
          center
          distanceFactor={12}
        >
          <div className="font-mono text-[11px] font-bold text-[#60a5fa] bg-black/85 px-2.5 py-1 rounded-full border border-[#3b82f6]/60 shadow-xl pointer-events-none select-none whitespace-nowrap animate-pulse">
            ● 0{activeStepIndex + 1} {roomMeta[activeStepIndex].name}
          </div>
        </Html>
      )}
      <group ref={roomRef} position={[0, 0, 0]}>
        {/* Blueprint Floor Grid */}
        <BlueprintDrawing progressRef={blueprintRef} />

        {/* FLOORS */}
        {/* Wood Floors: Living (-6..0.5, 0..4), Master (-6..-1.5, -4..0), Bed2 (0.5..3.5, -4..0), Balcony (3.5..6, -4..0) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.75, 0.005, 2]} material={woodMat}>
          <planeGeometry args={[6.5, 4]} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.75, 0.005, -2]} material={woodMat}>
          <planeGeometry args={[4.5, 4]} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.0, 0.005, -2]} material={woodMat}>
          <planeGeometry args={[3.0, 4]} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[4.75, 0.005, -2]} material={woodMat}>
          <planeGeometry args={[2.5, 4]} />
        </mesh>

        {/* Active Room Floor Outline Highlight */}
        {activeStepIndex >= 0 && activeStepIndex < roomMeta.length && (
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[roomMeta[activeStepIndex].center[0], 0.012, roomMeta[activeStepIndex].center[1]]}
          >
            <planeGeometry args={[roomMeta[activeStepIndex].size[0], roomMeta[activeStepIndex].size[1]]} />
            <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.8} />
          </mesh>
        )}

        {/* Tile Floors: Kitchen (0.5..4, 0..4), Foyer (4..6, 0..4), Bathroom (-1.5..0.5, -4..0) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.25, 0.006, 2]} material={tileMat}>
          <planeGeometry args={[3.5, 4]} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[5.0, 0.006, 2]} material={tileMat}>
          <planeGeometry args={[2.0, 4]} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.5, 0.006, -2]} material={tileMat}>
          <planeGeometry args={[2.0, 4]} />
        </mesh>

        {/* EXTERIOR WALLS (Front z=+4, Back z=-4, Left x=-6, Right x=+6) */}
        {/* Front wall (z = +4): x -6..4.5 and x 5.5..6 (Front door gap x 4.5..5.5) */}
        <Wall
          position={[-0.75, 1.4, 4]}
          size={[10.5, WALL_HEIGHT, 0.12]}
          buildRef={buildRef}
          blueprintRef={blueprintRef}
          explodeRef={explodeRef}
        />
        <Wall
          position={[5.75, 1.4, 4]}
          size={[0.5, WALL_HEIGHT, 0.12]}
          buildRef={buildRef}
          blueprintRef={blueprintRef}
          explodeRef={explodeRef}
        />

        {/* Left wall (x = -6): z -4..4 with Living Window at z 1..3 */}
        <Wall
          position={[-6, 1.4, -1.5]}
          size={[0.12, WALL_HEIGHT, 5.0]}
          buildRef={buildRef}
          blueprintRef={blueprintRef}
          explodeRef={explodeRef}
        />
        <mesh position={[-6, 1.6, 2]}>
          <boxGeometry args={[0.06, 1.4, 2.0]} />
          <primitive object={glassMat} />
        </mesh>
        <Wall
          position={[-6, 1.4, 3.5]}
          size={[0.12, WALL_HEIGHT, 1.0]}
          buildRef={buildRef}
          blueprintRef={blueprintRef}
          explodeRef={explodeRef}
        />

        {/* Right wall (x = +6): z -4..4 */}
        <Wall
          position={[6, 1.4, 0]}
          size={[0.12, WALL_HEIGHT, 8]}
          buildRef={buildRef}
          blueprintRef={blueprintRef}
          explodeRef={explodeRef}
        />

        {/* Back wall (z = -4): Master Window x -4.5..-2.5, Bed2 Window x 1..3, Balcony glass railing x 3.5..6 */}
        <Wall
          position={[-5.25, 1.4, -4]}
          size={[1.5, WALL_HEIGHT, 0.12]}
          buildRef={buildRef}
          blueprintRef={blueprintRef}
          explodeRef={explodeRef}
        />
        <mesh position={[-3.5, 1.6, -4]}>
          <boxGeometry args={[2.0, 1.4, 0.06]} />
          <primitive object={glassMat} />
        </mesh>
        <Wall
          position={[-0.75, 1.4, -4]}
          size={[3.5, WALL_HEIGHT, 0.12]}
          buildRef={buildRef}
          blueprintRef={blueprintRef}
          explodeRef={explodeRef}
        />
        <mesh position={[2.0, 1.6, -4]}>
          <boxGeometry args={[2.0, 1.4, 0.06]} />
          <primitive object={glassMat} />
        </mesh>
        {/* Balcony Low Glass Railing (z = -4, x 3.5..6) */}
        <mesh position={[4.75, 0.45, -4]}>
          <boxGeometry args={[2.5, 0.9, 0.06]} />
          <primitive object={glassMat} />
        </mesh>

        {/* INTERIOR PARTITION WALLS (z=0, x=-1.5, x=0.5, x=3.5, x=4) */}
        {/* Wall at z = 0 (from x=-6 to 6 with gaps: Master x -4..-3, Bath x -1..0, Bed2 x 1.5..2.5, Balcony sliding door x 4.4..5.6) */}
        <Wall
          position={[-5.0, 1.4, 0]}
          size={[2.0, WALL_HEIGHT, 0.12]}
          buildRef={buildRef}
          blueprintRef={blueprintRef}
          explodeRef={explodeRef}
        />
        <Wall
          position={[-2.0, 1.4, 0]}
          size={[2.0, WALL_HEIGHT, 0.12]}
          buildRef={buildRef}
          blueprintRef={blueprintRef}
          explodeRef={explodeRef}
        />
        <Wall
          position={[0.25, 1.4, 0]}
          size={[0.5, WALL_HEIGHT, 0.12]}
          buildRef={buildRef}
          blueprintRef={blueprintRef}
          explodeRef={explodeRef}
        />
        <Wall
          position={[3.0, 1.4, 0]}
          size={[1.0, WALL_HEIGHT, 0.12]}
          buildRef={buildRef}
          blueprintRef={blueprintRef}
          explodeRef={explodeRef}
        />
        <Wall
          position={[3.95, 1.4, 0]}
          size={[0.9, WALL_HEIGHT, 0.12]}
          buildRef={buildRef}
          blueprintRef={blueprintRef}
          explodeRef={explodeRef}
        />
        <Wall
          position={[5.8, 1.4, 0]}
          size={[0.4, WALL_HEIGHT, 0.12]}
          buildRef={buildRef}
          blueprintRef={blueprintRef}
          explodeRef={explodeRef}
        />

        {/* Partition x = -1.5 (z -4..0) */}
        <Wall
          position={[-1.5, 1.4, -2]}
          size={[0.12, WALL_HEIGHT, 4]}
          buildRef={buildRef}
          blueprintRef={blueprintRef}
          explodeRef={explodeRef}
        />

        {/* Partition x = 0.5 (z -4..0) */}
        <Wall
          position={[0.5, 1.4, -2]}
          size={[0.12, WALL_HEIGHT, 4]}
          buildRef={buildRef}
          blueprintRef={blueprintRef}
          explodeRef={explodeRef}
        />

        {/* Partition x = 3.5 (z -4..0) */}
        <Wall
          position={[3.5, 1.4, -2]}
          size={[0.12, WALL_HEIGHT, 4]}
          buildRef={buildRef}
          blueprintRef={blueprintRef}
          explodeRef={explodeRef}
        />

        {/* Partition x = 4.0 (z 0..4) with archway opening z 1.0..2.2 */}
        <Wall
          position={[4.0, 1.4, 0.5]}
          size={[0.12, WALL_HEIGHT, 1.0]}
          buildRef={buildRef}
          blueprintRef={blueprintRef}
          explodeRef={explodeRef}
        />
        <Wall
          position={[4.0, 1.4, 3.1]}
          size={[0.12, WALL_HEIGHT, 1.8]}
          buildRef={buildRef}
          blueprintRef={blueprintRef}
          explodeRef={explodeRef}
        />

        {/* FURNITURE & ROOM CONTENTS */}
        <group ref={furnitureRef} position={[0, 0, 0]}>
          {/* Instanced Meshes */}
          <instancedMesh ref={diningChairsRef} args={[undefined, undefined, 4]}>
            <boxGeometry args={[0.38, 0.46, 0.38]} />
            <primitive object={furnitureMat} />
          </instancedMesh>

          <instancedMesh ref={stoolRef} args={[undefined, undefined, 2]}>
            <cylinderGeometry args={[0.18, 0.18, 0.65, 12]} />
            <primitive object={furnitureMat} />
          </instancedMesh>

          <instancedMesh ref={cabinetDoorsRef} args={[undefined, undefined, 5]}>
            <boxGeometry args={[0.65, 0.6, 0.05]} />
            <primitive object={whiteMat} />
          </instancedMesh>

          {/* 1. ENTRY FOYER (x 4..6, z 0..4) */}
          {/* Shoe bench */}
          <mesh position={[5.2, 0.22, 0.6]} material={woodMat}>
            <boxGeometry args={[1.0, 0.4, 0.4]} />
          </mesh>
          {/* Coat rack */}
          <mesh position={[5.7, 0.85, 1.2]} material={furnitureMat}>
            <cylinderGeometry args={[0.04, 0.04, 1.7, 8]} />
          </mesh>
          {/* Console */}
          <mesh position={[4.3, 0.45, 3.2]} material={woodMat}>
            <boxGeometry args={[0.35, 0.85, 1.1]} />
          </mesh>

          {/* 2. KITCHEN (x 0.5..4, z 0..4) */}
          {/* Counters along front wall */}
          <mesh position={[2.2, 0.45, 3.7]} material={whiteMat}>
            <boxGeometry args={[3.2, 0.9, 0.6]} />
          </mesh>
          {/* Island */}
          <mesh position={[2.2, 0.45, 1.8]} material={whiteMat}>
            <boxGeometry args={[1.8, 0.9, 0.8]} />
          </mesh>
          {/* Sink */}
          <mesh position={[1.2, 0.91, 3.7]} material={furnitureMat}>
            <boxGeometry args={[0.6, 0.02, 0.4]} />
          </mesh>
          {/* Hob (four thin cylinders) */}
          <group position={[3.0, 0.91, 3.7]}>
            <mesh position={[-0.15, 0.01, -0.1]}>
              <cylinderGeometry args={[0.08, 0.08, 0.02, 12]} />
              <primitive object={furnitureMat} />
            </mesh>
            <mesh position={[0.15, 0.01, -0.1]}>
              <cylinderGeometry args={[0.08, 0.08, 0.02, 12]} />
              <primitive object={furnitureMat} />
            </mesh>
            <mesh position={[-0.15, 0.01, 0.1]}>
              <cylinderGeometry args={[0.08, 0.08, 0.02, 12]} />
              <primitive object={furnitureMat} />
            </mesh>
            <mesh position={[0.15, 0.01, 0.1]}>
              <cylinderGeometry args={[0.08, 0.08, 0.02, 12]} />
              <primitive object={furnitureMat} />
            </mesh>
          </group>
          {/* Tall fridge */}
          <mesh position={[0.8, 0.9, 0.6]} material={whiteMat}>
            <boxGeometry args={[0.7, 1.8, 0.7]} />
          </mesh>

          {/* 3. LIVING AND DINING (x -6..0.5, z 0..4) */}
          {/* L-shaped sofa */}
          <group position={[-4.2, 0.35, 2.2]}>
            {/* Main bench */}
            <mesh position={[0, 0, 0]} material={furnitureMat}>
              <boxGeometry args={[2.2, 0.45, 0.9]} />
            </mesh>
            {/* L-return */}
            <mesh position={[-0.85, 0, 0.85]} material={furnitureMat}>
              <boxGeometry args={[0.8, 0.45, 0.8]} />
            </mesh>
            {/* Copper Accent Cushion */}
            <mesh position={[0.5, 0.3, 0]} material={copperMat}>
              <boxGeometry args={[0.4, 0.25, 0.4]} />
            </mesh>
          </group>
          {/* Coffee table */}
          <mesh position={[-3.5, 0.22, 1.6]} material={woodMat}>
            <boxGeometry args={[1.0, 0.3, 0.6]} />
          </mesh>
          {/* TV unit with flat TV */}
          <group position={[-5.7, 0, 2.0]}>
            <mesh position={[0, 0.25, 0]} material={woodMat}>
              <boxGeometry args={[0.4, 0.5, 1.6]} />
            </mesh>
            <mesh position={[0.05, 0.85, 0]} material={furnitureMat}>
              <boxGeometry args={[0.08, 0.7, 1.2]} />
            </mesh>
          </group>

          {!isMobile && (
            <>
              {/* Rug in living room */}
              <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-3.8, 0.008, 2.0]}>
                <planeGeometry args={[3.2, 2.4]} />
                <meshStandardMaterial color="#2c4250" roughness={0.9} />
              </mesh>
              {/* Plant with teal accent */}
              <group position={[-5.5, 0, 3.5]}>
                <mesh position={[0, 0.25, 0]} material={furnitureMat}>
                  <cylinderGeometry args={[0.2, 0.15, 0.5, 12]} />
                </mesh>
                <mesh position={[0, 0.65, 0]} material={tealMat}>
                  <sphereGeometry args={[0.3, 8, 8]} />
                </mesh>
              </group>
            </>
          )}

          {/* Dining Table */}
          <mesh position={[-1.8, 0.38, 2.2]} material={woodMat}>
            <boxGeometry args={[1.4, 0.75, 0.9]} />
          </mesh>
          {/* Floor Lamp */}
          <group position={[-5.5, 0, 0.5]}>
            <mesh position={[0, 0.8, 0]} material={furnitureMat}>
              <cylinderGeometry args={[0.02, 0.02, 1.6, 8]} />
            </mesh>
            <mesh position={[0, 1.5, 0]} material={whiteMat}>
              <coneGeometry args={[0.22, 0.3, 12]} />
            </mesh>
          </group>

          {/* 4. MASTER BEDROOM (x -6..-1.5, z -4..0) */}
          {/* King bed */}
          <group position={[-3.8, 0, -2.5]}>
            {/* Frame */}
            <mesh position={[0, 0.2, 0]} material={woodMat}>
              <boxGeometry args={[2.0, 0.35, 2.1]} />
            </mesh>
            {/* Mattress */}
            <mesh position={[0, 0.42, 0]} material={whiteMat}>
              <boxGeometry args={[1.9, 0.25, 2.0]} />
            </mesh>
            {/* Headboard with Copper Accent */}
            <mesh position={[0, 0.75, -1.02]} material={copperMat}>
              <boxGeometry args={[2.1, 0.9, 0.12]} />
            </mesh>
            {/* Pillows */}
            <mesh position={[-0.45, 0.58, -0.75]} material={whiteMat}>
              <boxGeometry args={[0.6, 0.12, 0.35]} />
            </mesh>
            <mesh position={[0.45, 0.58, -0.75]} material={whiteMat}>
              <boxGeometry args={[0.6, 0.12, 0.35]} />
            </mesh>
          </group>
          {/* Bedside tables with lamps */}
          <group position={[-5.3, 0.25, -3.2]}>
            <mesh material={woodMat}>
              <boxGeometry args={[0.5, 0.5, 0.4]} />
            </mesh>
            <mesh position={[0, 0.4, 0]} material={copperMat}>
              <cylinderGeometry args={[0.1, 0.1, 0.3, 8]} />
            </mesh>
          </group>
          <group position={[-2.3, 0.25, -3.2]}>
            <mesh material={woodMat}>
              <boxGeometry args={[0.5, 0.5, 0.4]} />
            </mesh>
            <mesh position={[0, 0.4, 0]} material={copperMat}>
              <cylinderGeometry args={[0.1, 0.1, 0.3, 8]} />
            </mesh>
          </group>
          {/* Wardrobe along left wall */}
          <mesh position={[-5.6, 1.1, -1.2]} material={furnitureMat}>
            <boxGeometry args={[0.6, 2.2, 1.6]} />
          </mesh>

          {/* 5. BATHROOM (x -1.5..0.5, z -4..0) */}
          {/* Bathtub/Shower enclosure */}
          <mesh position={[-0.8, 0.3, -3.2]} material={whiteMat}>
            <boxGeometry args={[1.1, 0.55, 1.3]} />
          </mesh>
          {/* Toilet (cylinder plus box) */}
          <group position={[-1.1, 0, -0.8]}>
            <mesh position={[0, 0.22, 0]} material={whiteMat}>
              <cylinderGeometry args={[0.18, 0.18, 0.44, 12]} />
            </mesh>
            <mesh position={[0, 0.45, -0.2]} material={whiteMat}>
              <boxGeometry args={[0.38, 0.45, 0.22]} />
            </mesh>
          </group>
          {/* Vanity with basin and mirror panel */}
          <group position={[-0.1, 0, -2.2]}>
            <mesh position={[0, 0.4, 0]} material={woodMat}>
              <boxGeometry args={[0.5, 0.8, 1.2]} />
            </mesh>
            <mesh position={[0, 0.82, 0]} material={whiteMat}>
              <cylinderGeometry args={[0.2, 0.2, 0.1, 12]} />
            </mesh>
            <mesh position={[-0.2, 1.4, 0]} material={glassMat}>
              <boxGeometry args={[0.04, 0.8, 1.0]} />
            </mesh>
          </group>

          {/* 6. SECOND BEDROOM / STUDY (x 0.5..3.5, z -4..0) */}
          {/* Single bed */}
          <group position={[2.6, 0, -2.8]}>
            <mesh position={[0, 0.2, 0]} material={woodMat}>
              <boxGeometry args={[1.1, 0.35, 1.9]} />
            </mesh>
            <mesh position={[0, 0.42, 0]} material={whiteMat}>
              <boxGeometry args={[1.0, 0.25, 1.8]} />
            </mesh>
          </group>
          {/* Desk and chair */}
          <group position={[1.2, 0, -1.2]}>
            <mesh position={[0, 0.38, 0]} material={woodMat}>
              <boxGeometry args={[1.1, 0.75, 0.6]} />
            </mesh>
            <mesh position={[0, 0.23, 0.5]} material={furnitureMat}>
              <boxGeometry args={[0.4, 0.46, 0.4]} />
            </mesh>
          </group>
          {/* Wardrobe */}
          <mesh position={[1.0, 1.1, -3.2]} material={furnitureMat}>
            <boxGeometry args={[0.8, 2.2, 0.6]} />
          </mesh>

          {/* 7. BALCONY (x 3.5..6, z -4..0) */}
          {/* Two chairs & planter */}
          <mesh position={[4.6, 0.23, -2.2]} material={furnitureMat}>
            <boxGeometry args={[0.5, 0.46, 0.5]} />
          </mesh>
          <mesh position={[5.2, 0.23, -1.2]} material={furnitureMat}>
            <boxGeometry args={[0.5, 0.46, 0.5]} />
          </mesh>
          <group position={[4.2, 0, -3.5]}>
            <mesh position={[0, 0.2, 0]} material={furnitureMat}>
              <boxGeometry args={[0.4, 0.4, 0.4]} />
            </mesh>
            <mesh position={[0, 0.45, 0]} material={tealMat}>
              <sphereGeometry args={[0.22, 8, 8]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
