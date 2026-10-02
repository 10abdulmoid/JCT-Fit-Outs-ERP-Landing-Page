import { Component, useEffect, useMemo, useRef, type ErrorInfo, type MutableRefObject, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { FloorPlan } from './FloorPlan';
import { StaticSceneFallback } from './StaticSceneFallback';
import { getCanvasOpacity, getScrollProgress, setCameraPos, useActiveExplodeLayer, setActiveExplodeLayer } from '../hooks/scroll-store';
import { useSceneVisibility } from '../hooks/useSceneVisibility';

export const HERO_CAM_POS = new THREE.Vector3(0, 17, 2.5);
export const HERO_CAM_LOOK = new THREE.Vector3(0, 0, 0);

export const INSIDE_CAM_PATH = [
  new THREE.Vector3(3.8, 2.8, 9),
  new THREE.Vector3(3.4, 0.6, 5.5),
  new THREE.Vector3(2.9, 0.1, 3.3),
  new THREE.Vector3(0.5, 0.1, 1.0),
];
export const INSIDE_CAM_LOOK = new THREE.Vector3(-1, -0.2, -2);

export const EXPLODE_CAM_POS = new THREE.Vector3(11, 7, 14);
export const EXPLODE_CAM_LOOK = new THREE.Vector3(0, 0.5, 0);

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
    const converge = THREE.MathUtils.clamp((progressRef.current - 0.8) / 0.15, 0, 1);
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

function ExplodedLayers({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const activeExplodeLayer = useActiveExplodeLayer();
  const layersGroup = useRef<THREE.Group>(null);

  useFrame(() => {
    if (!layersGroup.current) return;
    const amount = THREE.MathUtils.clamp((progressRef.current - 0.59) / 0.21, 0, 1);
    const converge = THREE.MathUtils.clamp((progressRef.current - 0.79) / 0.16, 0, 1);

    layersGroup.current.children.forEach((child, index) => {
      const targetY = 1.5 + (index - 2) * 1.05;
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
              mat.emissiveIntensity = isActive ? 0.8 : 0.2;
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
        <group
          key={index}
          onPointerOver={() => setActiveExplodeLayer(index)}
          onClick={() => setActiveExplodeLayer(index)}
        >
          {/* Base platform */}
          <mesh position={[0, 0, 0]}>
            <boxGeometry args={[10, 0.05, 6]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.3} transparent opacity={0} />
          </mesh>

          {/* Layer 0: CRM - Desk cluster */}
          {index === 0 && (
            <group position={[0, 0.25, 0]}>
              <mesh position={[-2, 0, -1]}>
                <boxGeometry args={[1.5, 0.4, 0.8]} />
                <meshStandardMaterial color="#2dd4bf" emissive="#2dd4bf" />
              </mesh>
              <mesh position={[-2, 0.3, -1]}>
                <boxGeometry args={[0.8, 0.4, 0.1]} />
                <meshStandardMaterial color="#ffffff" emissive="#2dd4bf" />
              </mesh>
              <mesh position={[2, 0, 1]}>
                <boxGeometry args={[1.5, 0.4, 0.8]} />
                <meshStandardMaterial color="#2dd4bf" emissive="#2dd4bf" />
              </mesh>
            </group>
          )}

          {/* Layer 1: BOQ - Measurement lines */}
          {index === 1 && (
            <group position={[0, 0.2, 0]}>
              <mesh position={[0, 0, 0]}>
                <boxGeometry args={[8, 0.02, 4]} />
                <meshStandardMaterial color="#f97316" wireframe emissive="#f97316" />
              </mesh>
              <mesh position={[-3, 0.2, 0]}>
                <boxGeometry args={[0.04, 0.4, 0.04]} />
                <meshStandardMaterial color="#ffffff" emissive="#f97316" />
              </mesh>
              <mesh position={[3, 0.2, 0]}>
                <boxGeometry args={[0.04, 0.4, 0.04]} />
                <meshStandardMaterial color="#ffffff" emissive="#f97316" />
              </mesh>
            </group>
          )}

          {/* Layer 2: Scheduling - Gantt bars */}
          {index === 2 && (
            <group position={[0, 0.2, 0]}>
              {[-2, -0.8, 0.4, 1.6].map((z, i) => (
                <mesh key={i} position={[-2 + i * 1.2, 0, z]}>
                  <boxGeometry args={[2.5 + i * 0.4, 0.12, 0.3]} />
                  <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" />
                </mesh>
              ))}
            </group>
          )}

          {/* Layer 3: Procurement - Crate stacks */}
          {index === 3 && (
            <group position={[0, 0.3, 0]}>
              {[-3, -1, 1, 3].map((x, i) => (
                <mesh key={i} position={[x, 0.2, (i % 2) * 1 - 0.5]}>
                  <boxGeometry args={[0.8, 0.6, 0.8]} />
                  <meshStandardMaterial color="#d97706" emissive="#d97706" />
                </mesh>
              ))}
            </group>
          )}

          {/* Layer 4: Finance - Chart bars */}
          {index === 4 && (
            <group position={[0, 0.4, 0]}>
              {[0.4, 0.8, 0.6, 1.2, 1.5, 1.1, 1.8].map((h, i) => (
                <mesh key={i} position={[-3 + i * 1.0, h / 2, 0]}>
                  <boxGeometry args={[0.5, h, 0.5]} />
                  <meshStandardMaterial color="#10b981" emissive="#10b981" />
                </mesh>
              ))}
            </group>
          )}
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
    if (dist < 0.3 && now - lastWarnTime(wall.name) > 1000) {
      console.warn(
        `[Debug Warning] Camera (${camPos.x.toFixed(2)}, ${camPos.y.toFixed(2)}, ${camPos.z.toFixed(2)}) is within ${dist.toFixed(2)} (< 0.3) of ${wall.name}`
      );
      setWarnTime(wall.name, now);
    }
  });
}

function SceneWorld() {
  const { camera, pointer, size } = useThree();
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
    smooth.current = THREE.MathUtils.damp(smooth.current, getScrollProgress(), 6, delta);
    const p = smooth.current;

    blueprintRef.current = Math.max(0.4, THREE.MathUtils.clamp(p / 0.12, 0, 1));
    buildRef.current = THREE.MathUtils.clamp((p - 0.12) / 0.23, 0, 1);
    insideRef.current = THREE.MathUtils.clamp((p - 0.35) / 0.25, 0, 1);
    explodeRef.current = THREE.MathUtils.clamp((p - 0.6) / 0.2, 0, 1);
    convergeRef.current = THREE.MathUtils.clamp((p - 0.8) / 0.15, 0, 1);

    const pos = new THREE.Vector3();
    const look = new THREE.Vector3();

    if (p <= 0.35) {
      // Hero & Plan chapter (p = 0 to 0.35): top-down plan view
      pos.copy(HERO_CAM_POS);
      look.copy(HERO_CAM_LOOK);
    } else if (p <= 0.6) {
      // Inside chapter (p = 0.35 to 0.60): enters room
      const t = (p - 0.35) / 0.25;
      if (t <= 0.33) {
        const subT = t / 0.33;
        pos.lerpVectors(INSIDE_CAM_PATH[0], INSIDE_CAM_PATH[1], subT);
      } else if (t <= 0.66) {
        const subT = (t - 0.33) / 0.33;
        pos.lerpVectors(INSIDE_CAM_PATH[1], INSIDE_CAM_PATH[2], subT);
      } else {
        const subT = (t - 0.66) / 0.34;
        pos.lerpVectors(INSIDE_CAM_PATH[2], INSIDE_CAM_PATH[3], subT);
      }
      look.copy(INSIDE_CAM_LOOK);
    } else if (p <= 0.8) {
      // Explode chapter (p = 0.60 to 0.80): camera at (11, 7, 14) for 0.62-0.80
      if (p < 0.62) {
        const subT = (p - 0.6) / 0.02;
        pos.lerpVectors(INSIDE_CAM_PATH[3], EXPLODE_CAM_POS, subT);
        look.lerpVectors(INSIDE_CAM_LOOK, EXPLODE_CAM_LOOK, subT);
      } else {
        pos.copy(EXPLODE_CAM_POS);
        look.copy(EXPLODE_CAM_LOOK);
      }
    } else {
      // Portals / Collapse (p = 0.80 to 1.00)
      const t = (p - 0.8) / 0.2;
      pos.lerpVectors(EXPLODE_CAM_POS, new THREE.Vector3(0, 9, 15), t);
      look.lerpVectors(EXPLODE_CAM_LOOK, new THREE.Vector3(0, 0, 0), t);
    }

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
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  useEffect(() => {
    if (reduced) document.documentElement.classList.add('reduce-scene');
    return () => document.documentElement.classList.remove('reduce-scene');
  }, [reduced]);

  if (reduced) return <StaticSceneFallback />;

  const isRendering = visible && opacity > 0;

  return (
    <SceneErrorBoundary>
      <Canvas
        className="scene-canvas"
        aria-hidden="true"
        frameloop={isRendering ? 'always' : 'never'}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 17, 2.5], fov: 37 }}
      >
        {visible && <SceneWorld />}
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
