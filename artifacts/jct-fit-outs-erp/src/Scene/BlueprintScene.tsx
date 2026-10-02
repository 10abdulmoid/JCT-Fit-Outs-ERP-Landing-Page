import { Component, useEffect, useMemo, useRef, type ErrorInfo, type MutableRefObject, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Bloom, ChromaticAberration, EffectComposer, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import { FloorPlan } from './FloorPlan';
import { StaticSceneFallback } from './StaticSceneFallback';
import { getScrollProgress } from '../hooks/scroll-store';
import { useSceneVisibility } from '../hooks/useSceneVisibility';

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
      points[i * 3] = (Math.random() - .5) * 22;
      points[i * 3 + 1] = Math.random() * 8 - 1;
      points[i * 3 + 2] = (Math.random() - .5) * 18;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(points, 3));
    return geo;
  }, [count]);
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * .012; });
  return <points ref={ref} geometry={geometry}><pointsMaterial color="#8dbbff" size={.025} transparent opacity={.56} sizeAttenuation /></points>;
}

function PerformanceGuard() {
  const { gl } = useThree();
  const slowFor = useRef(0);
  const downgraded = useRef(false);
  useFrame((_, delta) => {
    slowFor.current = delta > .024 ? slowFor.current + delta : Math.max(0, slowFor.current - delta * 2);
    if (slowFor.current > 2 && !downgraded.current) {
      downgraded.current = true;
      gl.setPixelRatio(1);
    }
  }, -1);
  return null;
}

function ExplodedLayers({ progressRef }: { progressRef: MutableRefObject<number> }) {
  const layers = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!layers.current) return;
    const amount = THREE.MathUtils.clamp((progressRef.current - .59) / .22, 0, 1);
    const converge = THREE.MathUtils.clamp((progressRef.current - .79) / .21, 0, 1);
    layers.current.children.forEach((child, index) => {
      child.position.y = -1.04 + index * .12 + amount * (1 - converge) * ((index - 2) * .88);
      const material = (child as THREE.Mesh).material as THREE.MeshStandardMaterial;
      material.opacity = amount * (1 - converge);
    });
  });
  return <group ref={layers}>
    {Array.from({ length: 5 }, (_, index) => <mesh key={index} position={[0, -1.04 + index * .12, 0]}>
      <boxGeometry args={[11.6 - index * .16, .045, 7.6 - index * .15]} />
      <meshStandardMaterial color={index % 2 ? '#477cb7' : '#79a8dc'} emissive="#2866ba" emissiveIntensity={.32} transparent opacity={0} depthWrite={false} metalness={.18} roughness={.62} />
    </mesh>)}
  </group>;
}

function SceneWorld() {
  const { camera, pointer } = useThree();
  const camCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 16.5, 2.2), new THREE.Vector3(8.2, 8.4, 10.8), new THREE.Vector3(4.1, 5.6, 8.8),
    new THREE.Vector3(0, 3.3, 4.5), new THREE.Vector3(6, 8.2, 12), new THREE.Vector3(0, 11, 13),
    new THREE.Vector3(0, 8, 15),
  ]), []);
  const lookCurve = useMemo(() => new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(1.4, -.3, 0),
    new THREE.Vector3(0, -.25, -1), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0),
  ]), []);
  const smooth = useRef(0);
  const target = useRef(new THREE.Vector3());
  const group = useRef<THREE.Group>(null);
  const buildRef = useRef(.015);
  const blueprintRef = useRef(.4);
  const insideRef = useRef(0);
  const explodeRef = useRef(0);
  const convergeRef = useRef(0);
  const coreRef = useRef<THREE.Group>(null);
  const coreMaterial = useRef<THREE.MeshStandardMaterial>(null);
  const coreLight = useRef<THREE.PointLight>(null);
  useFrame((_, delta) => {
    smooth.current = THREE.MathUtils.damp(smooth.current, getScrollProgress(), 6, delta);
    blueprintRef.current = Math.max(.4, THREE.MathUtils.clamp(smooth.current / .12, 0, 1));
    buildRef.current = THREE.MathUtils.clamp((smooth.current - .12) / .23, 0, 1);
    insideRef.current = THREE.MathUtils.clamp((smooth.current - .35) / .25, 0, 1);
    explodeRef.current = THREE.MathUtils.clamp((smooth.current - .60) / .20, 0, 1);
    convergeRef.current = THREE.MathUtils.clamp((smooth.current - .80) / .20, 0, 1);
    const position = camCurve.getPoint(smooth.current);
    const aim = lookCurve.getPoint(smooth.current);
    position.x += pointer.x * .22;
    position.y += pointer.y * .13;

    camera.position.x = THREE.MathUtils.damp(camera.position.x, position.x, 6, delta);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, position.y, 6, delta);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, position.z, 6, delta);

    target.current.x = THREE.MathUtils.damp(target.current.x, aim.x, 6, delta);
    target.current.y = THREE.MathUtils.damp(target.current.y, aim.y, 6, delta);
    target.current.z = THREE.MathUtils.damp(target.current.z, aim.z, 6, delta);

    camera.lookAt(target.current);

    if (group.current) {
      const rotTarget = explodeRef.current * .28 + convergeRef.current * .65;
      group.current.rotation.y = THREE.MathUtils.damp(group.current.rotation.y, rotTarget, 4.5, delta);
    }

    if (coreRef.current) coreRef.current.scale.setScalar(.3 + convergeRef.current * 1.1);
    if (coreMaterial.current) coreMaterial.current.emissiveIntensity = convergeRef.current * 4;
    if (coreLight.current) coreLight.current.intensity = convergeRef.current * 4;
  });
  return (
    <>
      <PerformanceGuard />
      <color attach="background" args={['#101f26']} />
      <fog attach="fog" args={['#101f26', 11, 27]} />
      <ambientLight intensity={.8} />
      <hemisphereLight args={['#9bc8ff', '#182a25', 1.45]} />
      <directionalLight position={[-5, 10, 6]} color="#78aaff" intensity={2.2} />
      <directionalLight position={[7, 5, -6]} color="#c4845a" intensity={1.15} />
      <gridHelper args={[36, 36, '#2e619f', '#244765']} position={[0, -1.12, 0]} />
      <group ref={group}>
        <FloorPlan buildRef={buildRef} blueprintRef={blueprintRef} insideRef={insideRef} explodeRef={explodeRef} />
      </group>
      <ExplodedLayers progressRef={smooth} />
      <Dust />
      <group ref={coreRef} position={[0, 1.5, 0]} scale={.3}>
        <mesh><icosahedronGeometry args={[.45, 1]} /><meshStandardMaterial ref={coreMaterial} color="#60a5fa" emissive="#3b82f6" emissiveIntensity={0} wireframe /></mesh>
        <pointLight ref={coreLight} position={[0, .5, 0]} color="#3b82f6" intensity={0} distance={8} />
      </group>
    </>
  );
}

export function BlueprintScene() {
  const visible = useSceneVisibility();
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useEffect(() => {
    if (reduced) document.documentElement.classList.add('reduce-scene');
    return () => document.documentElement.classList.remove('reduce-scene');
  }, [reduced]);
  if (reduced) return <StaticSceneFallback />;
  return (
    <SceneErrorBoundary>
      <Canvas className="scene-canvas" aria-hidden="true" frameloop={visible ? 'always' : 'never'} dpr={[1, 1.5]} gl={{ antialias: true, alpha: false, powerPreference: 'low-power' }} camera={{ position: [0, 16.5, 2.2], fov: 37 }}>
        {visible && <SceneWorld />}
        {visible && <EffectComposer multisampling={0}><Bloom intensity={.52} luminanceThreshold={.76} luminanceSmoothing={.25} /><ChromaticAberration offset={new THREE.Vector2(.00028, .00028)} radialModulation={false} modulationOffset={0} /><Vignette eskil={false} offset={.22} darkness={.42} /></EffectComposer>}
      </Canvas>
    </SceneErrorBoundary>
  );
}
