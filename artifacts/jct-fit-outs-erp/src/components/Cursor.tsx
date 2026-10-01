import { useEffect } from 'react';
import gsap from 'gsap';

export function Cursor() {
  useEffect(() => {
    if (!window.matchMedia('(pointer:fine)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const dot = document.querySelector<HTMLElement>('.cursor-dot');
    const ring = document.querySelector<HTMLElement>('.cursor-ring');
    if (!dot || !ring) return;
    const xDot = gsap.quickTo(dot, 'x', { duration: .12, ease: 'power3' });
    const yDot = gsap.quickTo(dot, 'y', { duration: .12, ease: 'power3' });
    const xRing = gsap.quickTo(ring, 'x', { duration: .32, ease: 'power3' });
    const yRing = gsap.quickTo(ring, 'y', { duration: .32, ease: 'power3' });
    const move = (event: MouseEvent) => { xDot(event.clientX); yDot(event.clientY); xRing(event.clientX); yRing(event.clientY); };
    const over = (event: Event) => {
      const target = event.target as HTMLElement;
      const active = target.closest<HTMLElement>('a,button,input,textarea,[data-cursor]');
      if (active) {
        ring.classList.add('cursor-active');
        ring.dataset.label = active.dataset.cursor || (active.tagName === 'A' ? 'OPEN' : 'VIEW');
      } else {
        ring.classList.remove('cursor-active');
        delete ring.dataset.label;
      }
    };
    window.addEventListener('mousemove', move);
    document.addEventListener('mouseover', over);
    return () => { window.removeEventListener('mousemove', move); document.removeEventListener('mouseover', over); };
  }, []);
  return <div aria-hidden="true" className="hidden md:block"><span className="cursor-dot" /><span className="cursor-ring" /></div>;
}