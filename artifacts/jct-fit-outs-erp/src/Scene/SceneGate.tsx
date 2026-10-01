import { lazy, Suspense, useEffect, useState } from 'react';
import { StaticSceneFallback } from './StaticSceneFallback';

const BlueprintScene = lazy(() => import('./BlueprintScene').then(({ BlueprintScene: Scene }) => ({ default: Scene })));
let webgl2Support: boolean | undefined;

function supportsWebGL2() {
  if (webgl2Support !== undefined) return webgl2Support;
  try {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: false });
    webgl2Support = Boolean(context);
    context?.getExtension('WEBGL_lose_context')?.loseContext();
  } catch {
    webgl2Support = false;
  }
  return webgl2Support;
}

export function SceneGate() {
  const [canRenderScene, setCanRenderScene] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setCanRenderScene(!preference.matches && supportsWebGL2());
    update();
    preference.addEventListener('change', update);
    return () => preference.removeEventListener('change', update);
  }, []);

  if (!canRenderScene) return <StaticSceneFallback />;
  return (
    <Suspense fallback={<StaticSceneFallback />}>
      <BlueprintScene />
    </Suspense>
  );
}