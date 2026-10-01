import { useEffect, useSyncExternalStore } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

let scrollProgress = 0;
let scrollVelocity = 0;
const listeners = new Set<() => void>();
let activeLenis: Lenis | null = null;
const publish = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
const snapshot = () => scrollProgress;
export const getScrollProgress = () => scrollProgress;
export const getScrollVelocity = () => scrollVelocity;

export function useScrollProgress() {
  return useSyncExternalStore(subscribe, snapshot, () => 0);
}

export function useLenisGsap() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lenis = reduced ? null : new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: .85 });
    const tick = (time: number) => lenis?.raf(time * 1000);
    if (lenis) {
      activeLenis = lenis;
      lenis.on('scroll', (event: { progress: number; velocity: number }) => {
        scrollVelocity = event.velocity;
        ScrollTrigger.update();
      });
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
    }
    let cancelled = false;
    const trigger = ScrollTrigger.create({
      trigger: '#story',
      start: 'top top',
      end: 'bottom bottom',
      scrub: 1,
      onUpdate: (self) => { scrollProgress = self.progress; publish(); },
    });
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('resize', refresh);
    document.fonts?.ready.then(() => { if (!cancelled) refresh(); });
    return () => {
      cancelled = true;
      window.removeEventListener('resize', refresh);
      trigger.kill();
      if (lenis) {
        gsap.ticker.remove(tick);
        lenis.destroy();
      }
      activeLenis = null;
      ScrollTrigger.getAll().forEach((item) => item.kill());
    };
  }, []);
}

export function scrollToChapter(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  if (activeLenis) activeLenis.scrollTo(target, { offset: 0, duration: 1.35 });
  else target.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
}