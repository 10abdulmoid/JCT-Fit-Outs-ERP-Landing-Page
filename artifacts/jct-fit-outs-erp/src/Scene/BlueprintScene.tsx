import { Component, useEffect, useMemo, useRef, useState, type ErrorInfo, type MutableRefObject, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls } from '@react-three/drei';
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { FloorPlan } from './FloorPlan';
import { StaticSceneFallback } from './StaticSceneFallback';
import { getCanvasOpacity, getScrollProgress, setCameraPos, setDrawCalls, useActiveExplodeLayer, setActiveExplodeLayer } from '../hooks/scroll-store';
import { useSceneVisibility } from '../hooks/useSceneVisibility';

// Named constants for camera positions and timing
export const HERO_CAM_POS = new THREE.Vector3(0, 17, 2.5);
export const HERO_CAM_LOOK = new THREE.Vector3(0, 0, 0);

export const INSIDE_WAYPOINTS = [
  new THREE.Vector3(5.0, 0.1, 5.5),   // Start outside front door
  new THREE.Vector3(5.0, 0.1, 2.5),   // 1. Lead: Foyer
  new THREE.Vector3(2.2, 0.1, 2.0),   // 2. Site visit: Kitchen island
  new THREE.Vector3(-2.8, 0.1, 2.0),  // 3. BOQ: Living & Dining
  new THREE.Vector3(-3.8, 0.1, -2.0), // 4. Client approval: Master bedroom
  new THREE.Vector3(-0.5, 0.1, 0.8),  // 5. Schedule: Looking into Bathroom
  new THREE.Vector3(2.0, 0.1, 0.8),   // 6. Billing: Looking into Bedroom 2
];

export const INSIDE_LOOKATS = [
  new THREE.Vector3(5.0, 0.1, 2.5),   // Looking in front door
  new THREE.Vector3(4.5, 0.1, 1.0),   // Looking toward foyer archway
  new THREE.Vector3(0.5, 0.1, 2.0),   // Looking across kitchen
  new THREE.Vector3(-4.5, 0.1, 2.0),  // Looking at sofa / dining
  new THREE.Vector3(-4.5, 0.1, -2.5), // Looking at king bed
  new THREE.Vector3(-0.5, 0.1, -2.0), // Looking into bathroom
  new THREE.Vector3(2.0, 0.1, -2.0),  // Looking into bedroom 2
];

export const EXPLODE_CAM_POS = new THREE.Vector3(9, 6.5, 12);
export const EXPLODE_CAM_LOOK = new THREE.Vector3(0, 1, 0);

export const ROOM_LABELS = [
  { name: 'Entry', pos: [5.0, 0.2, 2.0] as [number, number, number] },
  { name: 'Kitchen', pos: [2.25, 0.2, 2.0] as [number, number, number] },
  { name: 'Living', pos: [-2.75, 0.2, 2.0] as [number, number, number] },
  { name: 'Master bedroom', pos: [-3.75, 0.2, -2.0] as [number, number, number] },
  { name: 'Bath', pos: [-0.5, 0.2, -2.0] as [number, number, number] },
  { name: 'Bedroom 2', pos: [2.0, 0.2, -2.0] as [number, number, number] },
  { name: 'Balcony', pos: [4.75, 0.2, -2.0] as [number, number, number] },
];

const posCurve = new THREE.CatmullRomCurve3(INSIDE_WAYPOINTS);
const lookCurve = new THREE.CatmullRomCurve3(INSIDE_LOOKATS);

class SceneErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo) {
    console.warn('WebGL scene unavailable; using the static blueprint scene.', error);
  }

  render() {
    return this.state.failed ? <StaticSceneFallback /> : this.props.children;
  }
}

function Dust() {
  const ref = useRef<THREE.Points>(null);
  const count = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches ? 180 : 800;
  const geometry = useMemo(() => {
    const points = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      points[i * 3] = (Math.random() - 0.5) * 22;
      points[i * 3 + 1] = Math.random() * 8 - 1;
      points[i * 3 + 2] = (Math.random() - 0.5) * 18;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(points, 3));
    return geo;
  }, [count]);
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * 0.012;
  });
  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#8dbbff" size={0.025} transparent opacity={0.56} sizeAttenuation />
    </points>
  );
}

function PerformanceGuard() {
  const { gl } = useThree();
  const slowFor = useRef(0);
  const downgraded = useRef(false);
  useFrame((_, delta) => {
    slowFor.current = delta > 0.024 ? slowFor.current + delta : Math.max(0, slowFor.current - delta * 2);
    if (slowFor.current > 2 && !downgraded.current) {
      downgraded.current = true;
      gl.setPixelRatio(1);
    }
  }, -1);
  return null;
}

function RoomPlanLabels() {
  const [mounted, setMounted] = useState(false);
  const groupRef = useRef<THREE.Group>(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.visible = mounted && camera.position.y >= 9.5;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {ROOM_LABELS.map((room) => (
        <Html key={room.name} position={room.pos} center distanceFactor={15}>
          <div className="font-mono text-[11px] font-semibold text-white/90 bg-black/70 px-2 py-0.5 rounded border border-white/20 shadow-lg pointer-events-none select-none whitespace-nowrap transition-opacity duration-500">
            {room.name}
          </div>
        </Html>
      ))}
    </group>
  );
}

function SpiralParticles({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const ref = useRef<THREE.Points>(null);
  const count = 200;

  const [geometry, initialCoords] = useMemo(() => {
    const points = new Float32Array(count * 3);
    const coords: { radius: number; angle: number; y: number; speed: number }[] = [];
    for (let i = 0; i < count; i++) {
      const radius = 1.2 + Math.random() * 4.5;
      const angle = Math.random() * Math.PI * 2;
      const y = (Math.random() - 0.5) * 3;
      coords.push({ radius, angle, y, speed: 0.5 + Math.random() * 1.5 });
      points[i * 3] = radius * Math.cos(angle);
      points[i * 3 + 1] = y + 1.5;
      points[i * 3 + 2] = radius * Math.sin(angle);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(points, 3));
    return [geo, coords];
  }, [count]);

  useFrame((_, delta) => {
    if (!ref.current) return;
    const converge = THREE.MathUtils.clamp((progressRef.current - 0.7875) / 0.05, 0, 1);
    const positions = ref.current.geometry.attributes.position.array as Float32Array;

    for (let i = 0; i < count; i++) {
      const coord = initialCoords[i];
      coord.angle += delta * coord.speed * (1 + converge * 4);
      const currentRadius = coord.radius * (1 - converge * 0.92);
      const currentY = coord.y * (1 - converge) + 1.5;

      positions[i * 3] = currentRadius * Math.cos(coord.angle);
      positions[i * 3 + 1] = currentY;
      positions[i * 3 + 2] = currentRadius * Math.sin(coord.angle);
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
    (ref.current.material as THREE.PointsMaterial).opacity = converge * 0.9;
  });

  return (
    <points ref={ref} geometry={geometry}>
      <pointsMaterial color="#60a5fa" size={0.08} transparent opacity={0} depthWrite={false} />
    </points>
  );
}

const layerDetails = [
  { name: 'CRM', desc: 'Lead markers & room pins at entry & living' },
  { name: 'BOQ & Estimating', desc: 'Dimension lines & quantity tags per room' },
  { name: 'Scheduling', desc: 'Gantt phase bar strip & work phase colors' },
  { name: 'Procurement & Stock', desc: 'Furniture copy & crate stacks beside flat' },
  { name: 'Finance & P&L', desc: 'Per-room green cost bars with dynamic height' },
];

function ExplodedLayers({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const activeExplodeLayer = useActiveExplodeLayer();
  const layersGroup = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!layersGroup.current) return;
    const amount = THREE.MathUtils.clamp((progressRef.current - 0.65) / 0.0625, 0, 1);
    const converge = THREE.MathUtils.clamp((progressRef.current - 0.7875) / 0.05, 0, 1);

    layersGroup.current.children.forEach((child, index) => {
      const targetY = 1.5 + (index - 2) * 1.1;
      child.position.y = THREE.MathUtils.lerp(-1.0, targetY, amount) * (1 - converge) + 1.5 * converge;

      const scale = (1 - converge) * amount;
      child.scale.setScalar(scale);

      const isActive = activeExplodeLayer === index;
      const targetOpacity = amount * (1 - converge) * (isActive ? 1.0 : 0.3);

      child.traverse((node) => {
        if ((node as THREE.Mesh).isMesh) {
          const mat = (node as THREE.Mesh).material as THREE.MeshStandardMaterial;
          if (mat) {
            mat.transparent = true;
            mat.opacity = targetOpacity;
            if (mat.emissive) {
              mat.emissiveIntensity = isActive ? 0.9 : 0.2;
            }
          }
        }
      });
    });
  });

  const layerColors = ['#2dd4bf', '#f97316', '#3b82f6', '#d97706', '#10b981'];

  return (
    <group ref={layersGroup}>
      {layerColors.map((color, index) => (
        <group key={index}>
          {/* Base platform slab with SAME flat footprint (12x8) */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[12, 0.05, 8]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0} />
          </mesh>

          {/* Layer 0: CRM - Room-name pins & lead markers */}
          {index === 0 && (
            <group position={[0, 0.25, 0]}>
              <mesh position={[5.0, 0.4, 2.0]}>
                <sphereGeometry args={[0.2, 12, 12]} />
                <meshStandardMaterial color="#2dd4bf" emissive="#2dd4bf" />
              </mesh>
              <mesh position={[5.0, 0.1, 2.0]}>
                <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
                <meshStandardMaterial color="#ffffff" />
              </mesh>
              <mesh position={[-2.75, 0.4, 2.0]}>
                <sphereGeometry args={[0.2, 12, 12]} />
                <meshStandardMaterial color="#2dd4bf" emissive="#2dd4bf" />
              </mesh>
            </group>
          )}

          {/* Layer 1: BOQ & Estimating - Dimension lines & quantity tags */}
          {index === 1 && (
            <group position={[0, 0.2, 0]}>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[11.8, 0.02, 7.8]} />
                <meshStandardMaterial color="#f97316" wireframe emissive="#f97316" />
              </mesh>
            </group>
          )}

          {/* Layer 2: Scheduling - Work phase colors & Gantt bar strip along front edge */}
          {index === 2 && (
            <group position={[0, 0.2, 0]}>
              <mesh position={[0, 0.05, 3.9]}>
                <boxGeometry args={[11.5, 0.1, 0.2]} />
                <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" />
              </mesh>
            </group>
          )}

          {/* Layer 3: Procurement & Stock - Lifted copy of furniture & crate stacks beside flat */}
          {index === 3 && (
            <group position={[0, 0.3, 0]}>
              {[-6.8, -6.8, -6.8].map((x, i) => (
                <mesh key={i} position={[x, 0.3 * i, -2 + i * 1.2]}>
                  <boxGeometry args={[0.8, 0.5, 0.8]} />
                  <meshStandardMaterial color="#d97706" emissive="#d97706" />
                </mesh>
              ))}
            </group>
          )}

          {/* Layer 4: Finance & P&L - Per-room cost bars standing in green */}
          {index === 4 && (
            <group position={[0, 0.4, 0]}>
              {[
                [5.0, 2.0, 0.6],
                [2.25, 2.0, 0.9],
                [-2.75, 2.0, 1.4],
                [-3.75, -2.0, 1.2],
                [-0.5, -2.0, 0.5],
                [2.0, -2.0, 0.8],
                [4.75, -2.0, 0.4],
              ].map(([x, z, h], i) => (
                <mesh key={i} position={[x, h / 2, z]}>
                  <boxGeometry args={[0.4, h, 0.4]} />
                  <meshStandardMaterial color="#10b981" emissive="#10b981" />
                </mesh>
              ))}
            </group>
          )}

          {/* Layer label via drei <Html> */}
          <Html position={[6.2, 0, 0]} center distanceFactor={16}>
            <div className="flex items-center gap-3 select-none pointer-events-auto">
              <div className="w-10 h-px bg-white/40" />
              <button
                type="button"
                onClick={() => setActiveExplodeLayer(index)}
                onFocus={() => setActiveExplodeLayer(index)}
                className={`text-left rounded-lg p-2.5 backdrop-blur-md border transition-all duration-200 ${
                  activeExplodeLayer === index
                    ? 'bg-black/90 border-[#3b82f6] text-white shadow-xl scale-105'
                    : 'bg-black/50 border-white/10 text-white/60 hover:text-white'
                }`}
              >
                <div className="font-mono text-[10px] font-bold text-[#78aaff]">
                  0{index + 1} / {layerDetails[index].name}
                </div>
                <div className="text-[10px] text-white/80 max-w-[160px] leading-snug">
                  {layerDetails[index].desc}
                </div>
              </button>
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

function lastWarnTime(key: string) {
  if (typeof window === 'undefined') return 0;
  return (window as unknown as Record<string, number>)[`_warn_${key}`] || 0;
}
function setWarnTime(key: string, val: number) {
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, number>)[`_warn_${key}`] = val;
  }
}

function checkWallProximity(camPos: THREE.Vector3) {
  if (typeof window === 'undefined' || !new URLSearchParams(window.location.search).has('debug')) return;

  const wallBoxes = [
    { name: 'Back Wall', min: new THREE.Vector3(-6, -1.1, -4.1), max: new THREE.Vector3(6, 1.7, -3.9) },
    { name: 'Left Wall', min: new THREE.Vector3(-6.1, -1.1, -4), max: new THREE.Vector3(-5.9, 1.7, 4) },
    { name: 'Right Wall', min: new THREE.Vector3(5.9, -1.1, -4), max: new THREE.Vector3(6.1, 1.7, 4) },
    { name: 'Front Wall', min: new THREE.Vector3(-6, -1.1, 3.9), max: new THREE.Vector3(2.25, 1.7, 4.1) },
  ];

  const now = Date.now();
  wallBoxes.forEach((wall) => {
    const closestX = THREE.MathUtils.clamp(camPos.x, wall.min.x, wall.max.x);
    const closestY = THREE.MathUtils.clamp(camPos.y, wall.min.y, wall.max.y);
    const closestZ = THREE.MathUtils.clamp(camPos.z, wall.min.z, wall.max.z);

    const dist = camPos.distanceTo(new THREE.Vector3(closestX, closestY, closestZ));
    if (dist < 0.45 && now - lastWarnTime(wall.name) > 1000) {
      console.warn(
        `[Debug Proximity Warning] Camera (${camPos.x.toFixed(2)}, ${camPos.y.toFixed(2)}, ${camPos.z.toFixed(2)}) is within ${dist.toFixed(2)} (< 0.45) of ${wall.name}`
      );
      setWarnTime(wall.name, now);
    }
  });
}

function SceneWorld({ freeCamActive }: { freeCamActive: boolean }) {
  const { camera, pointer, size, gl } = useThree();
  const smooth = useRef(0);
  const target = useRef(new THREE.Vector3());
  const group = useRef<THREE.Group>(null);
  const buildRef = useRef(0.015);
  const blueprintRef = useRef(0.4);
  const insideRef = useRef(0);
  const explodeRef = useRef(0);
  const convergeRef = useRef(0);
  const coreRef = useRef<THREE.Group>(null);
  const coreMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const coreLight = useRef<THREE.PointLight>(null);

  useFrame((_, delta) => {
    setDrawCalls(gl.info.render.calls);

    if (freeCamActive) return;

    smooth.current = THREE.MathUtils.damp(smooth.current, getScrollProgress(), 6, delta);
    const p = smooth.current;

    blueprintRef.current = Math.max(0.4, THREE.MathUtils.clamp(p / 0.12, 0, 1));
    buildRef.current = THREE.MathUtils.clamp((p - 0.12) / 0.23, 0, 1);
    insideRef.current = THREE.MathUtils.clamp((p - 0.35) / 0.25, 0, 1);
    explodeRef.current = THREE.MathUtils.clamp((p - 0.6) / 0.25, 0, 1);
    convergeRef.current = THREE.MathUtils.clamp((p - 0.7875) / 0.05, 0, 1);

    const pos = new THREE.Vector3();
    const look = new THREE.Vector3();

    if (p <= 0.35) {
      // Hero & Plan chapter (p = 0 to 0.35): top-down plan view
      pos.copy(HERO_CAM_POS);
      look.copy(HERO_CAM_LOOK);
      (camera as THREE.PerspectiveCamera).fov = 37;
    } else if (p <= 0.6) {
      // Inside chapter (p = 0.35 to 0.60): eye-height camera tour
      const t = (p - 0.35) / 0.25;
      posCurve.getPoint(t, pos);
      lookCurve.getPoint(t, look);

      // Widen FOV to 58 during Inside chapter
      const insideFactor = Math.sin(t * Math.PI);
      (camera as THREE.PerspectiveCamera).fov = THREE.MathUtils.lerp(37, 58, insideFactor);
    } else if (p <= 0.85) {
      // Explode chapter (p = 0.60 to 0.85): camera at (9, 6.5, 12) looking at (0, 1, 0)
      if (p < 0.62) {
        const subT = (p - 0.6) / 0.02;
        pos.lerpVectors(INSIDE_WAYPOINTS[INSIDE_WAYPOINTS.length - 1], EXPLODE_CAM_POS, subT);
        look.lerpVectors(INSIDE_LOOKATS[INSIDE_LOOKATS.length - 1], EXPLODE_CAM_LOOK, subT);
      } else {
        pos.copy(EXPLODE_CAM_POS);
        look.copy(EXPLODE_CAM_LOOK);
      }
      (camera as THREE.PerspectiveCamera).fov = 37;
    } else {
      // Portals / Collapse (p = 0.85 to 1.00)
      const t = (p - 0.85) / 0.15;
      pos.lerpVectors(EXPLODE_CAM_POS, new THREE.Vector3(0, 9, 15), t);
      look.lerpVectors(EXPLODE_CAM_LOOK, new THREE.Vector3(0, 0, 0), t);
      (camera as THREE.PerspectiveCamera).fov = 37;
    }

    (camera as THREE.PerspectiveCamera).updateProjectionMatrix();

    pos.x += pointer.x * 0.22;
    pos.y += pointer.y * 0.13;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, pos.x, 6, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pos.y, 6, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, pos.z, 6, delta);

    target.current.x = THREE.MathUtils.damp(target.current.x, look.x, 6, delta);
    target.current.y = THREE.MathUtils.damp(target.current.y, look.y, 6, delta);
    target.current.z = THREE.MathUtils.damp(target.current.z, look.z, 6, delta);

    camera.lookAt(target.current);

    // Desktop view offset for Hero chapter
    const aspect = size.width / Math.max(1, size.height);
    if (aspect > 1.4 && p < 0.35) {
      const offsetFactor = Math.max(0, 1 - p / 0.35);
      const xOffset = -0.16 * size.width * offsetFactor;
      (camera as THREE.PerspectiveCamera).setViewOffset(size.width, size.height, xOffset, 0, size.width, size.height);
    } else if (p >= 0.6 && p <= 0.85 && aspect > 1.4) {
      const xOffset = -0.12 * size.width;
      (camera as THREE.PerspectiveCamera).setViewOffset(size.width, size.height, xOffset, 0, size.width, size.height);
    } else {
      (camera as THREE.PerspectiveCamera).clearViewOffset();
    }

    setCameraPos(camera.position.x, camera.position.y, camera.position.z);
    checkWallProximity(camera.position);

    if (group.current) {
      const rotTarget = explodeRef.current * 0.28 + convergeRef.current * 0.65;
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, rotTarget, 4.5, delta);
    }

    if (coreRef.current) coreRef.current.scale.setScalar(0.3 + convergeRef.current * 1.1);
    if (coreMaterial.current) coreMaterial.current.emissiveIntensity = convergeRef.current * 4;
    if (coreLight.current) coreLight.current.intensity = convergeRef.current * 4;
  });

  return (
    <>
      <PerformanceGuard />
      <color attach="background" args={['#101f26']} />
      <fog attach="fog" args={['#101f26', 11, 27]} />
      <ambientLight intensity={0.8} />
      <hemisphereLight args={['#9bc8ff', '#182a25', 1.45]} />
      <directionalLight position={[-5, 10, 6]} color="#78aaff" intensity={2.2} />
      <directionalLight position={[7, 5, -6]} color="#c4845a" intensity={1.15} />
      <gridHelper args={[36, 36, '#2e619f', '#244765']} position={[0, -1.12, 0]} />

      <group ref={group}>
        <FloorPlan buildRef={buildRef} blueprintRef={blueprintRef} insideRef={insideRef} explodeRef={explodeRef} />
      </group>

      <RoomPlanLabels />
      <ExplodedLayers progressRef={smooth} />
      <SpiralParticles progressRef={smooth} />
      <Dust />

      <group ref={coreRef} position={[0, 1.5, 0]} scale={0.3}>
        <mesh>
          <icosahedronGeometry args={[0.45, 1]} />
          <meshStandardMaterial ref={coreMaterial} color="#60a5fa" emissive="#3b82f6" emissiveIntensity={0} wireframe />
        </mesh>
        <pointLight ref={coreLight} position={[0, 0.5, 0]} color="#3b82f6" intensity={0} distance={8} />
      </group>
    </>
  );
}

export function BlueprintScene() {
  const visible = useSceneVisibility();
  const opacity = getCanvasOpacity();
  const isDebug = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug');
  const [freeCamActive, setFreeCamActive] = useState(false);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reduced) document.documentElement.classList.add('reduce-scene');
    return () => document.documentElement.classList.remove('reduce-scene');
  }, [reduced]);

  if (reduced) return <StaticSceneFallback />;

  const isRendering = visible && opacity > 0;

  return (
    <SceneErrorBoundary>
      {isDebug && (
        <div className="fixed top-24 left-6 z-50 flex items-center gap-2 bg-black/80 px-3 py-1.5 rounded-full border border-emerald-500/50 text-emerald-400 font-mono text-[11px] shadow-lg">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={freeCamActive}
              onChange={(e) => setFreeCamActive(e.target.checked)}
              className="accent-emerald-500"
            />
            <span>OrbitControls Free Cam</span>
          </label>
        </div>
      )}

      <Canvas
        className="scene-canvas"
        aria-hidden="true"
        frameloop={isRendering ? 'always' : 'never'}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 17, 2.5], fov: 37 }}
      >
        {visible && <SceneWorld freeCamActive={freeCamActive} />}
        {visible && freeCamActive && <OrbitControls makeDefault />}
        {visible && (
          <EffectComposer multisampling={4}>
            <Bloom intensity={0.52} luminanceThreshold={0.76} luminanceSmoothing={0.25} />
            <ChromaticAberration offset={new THREE.Vector2(0.00028, 0.00028)} radialModulation={false} modulationOffset={0} />
            <Vignette eskil={false} offset={0.22} darkness={0.42} />
          </EffectComposer>
        )}
      </Canvas>
    </SceneErrorBoundary>
  );
}
