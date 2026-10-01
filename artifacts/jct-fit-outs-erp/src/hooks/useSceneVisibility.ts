import { useEffect, useState } from 'react';

export function useSceneVisibility() {
  const [visible, setVisible] = useState(() => typeof document !== 'undefined' && !document.hidden);
  useEffect(() => {
    let inViewport = true;
    const update = () => setVisible(!document.hidden && inViewport);
    const canvas = document.querySelector('.scene-canvas');
    const observer = new IntersectionObserver(([entry]) => {
      inViewport = entry.isIntersecting;
      update();
    });
    if (canvas) observer.observe(canvas);
    document.addEventListener('visibilitychange', update);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, []);
  return visible;
}