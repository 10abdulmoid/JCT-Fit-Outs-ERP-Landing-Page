import { useEffect, useSyncExternalStore } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

export const CHAPTER_STOPS = [
  ['top', 'Hero'],
  ['plan', 'Plan it'],
  ['inside', 'Inside'],
  ['explode', 'ERP modules'],
  ['portals', 'Portals'],
  ['finance', 'Financial control'],
  ['demo', 'Book a demo'],
] as const;

export type ChapterId = (typeof CHAPTER_STOPS)[number][0];

let sceneProgress = 0;
let canvasOpacity = 1;
let activeChapterId: ChapterId = 'top';
let scrollVelocity = 0;
let activeLenis: Lenis | null = null;

const listeners = new Set<() => void>();
const publish = () => listeners.forEach((listener) => listener());
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const getScrollProgress = () => sceneProgress;
export const getCanvasOpacity = () => canvasOpacity;
export const getActiveChapterId = () => activeChapterId;
export const getActiveChapterIndex = () => {
  const index = CHAPTER_STOPS.findIndex(([id]) => id === activeChapterId);
  return index >= 0 ? index : 0;
};
export const getScrollVelocity = () => scrollVelocity;

export function getMeasuredBoundaryValues() {
  return {
    top: 0.0,
    plan: 0.12,
    inside: 0.35,
    explode: 0.6,
    portals: 1.0,
  };
}

export function useScrollProgress() {
  return useSyncExternalStore(subscribe, getScrollProgress, () => 0);
}

export function useActiveChapterId() {
  return useSyncExternalStore(subscribe, getActiveChapterId, () => 'top' as ChapterId);
}

export function useActiveChapterIndex() {
  return useSyncExternalStore(subscribe, getActiveChapterIndex, () => 0);
}

function updateSceneMetrics() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  const topEl = document.getElementById('top');
  const planEl = document.getElementById('plan');
  const insideEl = document.getElementById('inside');
  const explodeEl = document.getElementById('explode');
  const portalsEl = document.getElementById('portals');

  const currentScroll = window.scrollY || window.pageYOffset || 0;

  const topPos = topEl ? topEl.getBoundingClientRect().top + currentScroll : 0;
  const planPos = planEl ? planEl.getBoundingClientRect().top + currentScroll : topPos + 800;
  const insidePos = insideEl ? insideEl.getBoundingClientRect().top + currentScroll : planPos + 800;
  const explodeTopPos = explodeEl ? explodeEl.getBoundingClientRect().top + currentScroll : insidePos + 800;
  const explodeBottomPos = explodeEl
    ? explodeEl.getBoundingClientRect().bottom + currentScroll
    : explodeTopPos + 800;

  if (currentScroll <= topPos) {
    sceneProgress = 0;
  } else if (currentScroll <= planPos) {
    const span = Math.max(1, planPos - topPos);
    sceneProgress = 0 + 0.12 * ((currentScroll - topPos) / span);
  } else if (currentScroll <= insidePos) {
    const span = Math.max(1, insidePos - planPos);
    sceneProgress = 0.12 + (0.35 - 0.12) * ((currentScroll - planPos) / span);
  } else if (currentScroll <= explodeTopPos) {
    const span = Math.max(1, explodeTopPos - insidePos);
    sceneProgress = 0.35 + (0.60 - 0.35) * ((currentScroll - insidePos) / span);
  } else if (currentScroll <= explodeBottomPos) {
    const span = Math.max(1, explodeBottomPos - explodeTopPos);
    sceneProgress = 0.60 + (1.0 - 0.60) * ((currentScroll - explodeTopPos) / span);
  } else {
    sceneProgress = 1.0;
  }

  sceneProgress = Math.max(0, Math.min(1, sceneProgress));

  // Canvas opacity fade out when #portals begins entering viewport
  if (portalsEl) {
    const portalsTop = portalsEl.getBoundingClientRect().top;
    const vh = window.innerHeight || 1;
    if (portalsTop >= vh) {
      canvasOpacity = 1;
    } else if (portalsTop <= 0) {
      canvasOpacity = 0;
    } else {
      canvasOpacity = Math.max(0, Math.min(1, portalsTop / vh));
    }
  } else {
    canvasOpacity = 1;
  }

  const canvasEl = document.querySelector('.scene-canvas') as HTMLElement | null;
  if (canvasEl) {
    canvasEl.style.setProperty('opacity', String(canvasOpacity), 'important');
  }

  const washEl = document.querySelector('.scene-wash') as HTMLElement | null;
  if (washEl) {
    washEl.style.setProperty('opacity', String(canvasOpacity), 'important');
  }

  // Derive active chapter from real DOM element viewport positions
  const viewportThreshold = window.innerHeight * 0.4;
  let newActiveId: ChapterId = 'top';
  for (const [id] of CHAPTER_STOPS) {
    const el = document.getElementById(id);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.top <= viewportThreshold) {
        newActiveId = id as ChapterId;
      }
    }
  }
  activeChapterId = newActiveId;

  publish();
}

export function useLenisGsap() {
  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const lenis = reduced
      ? null
      : new Lenis({ duration: 1.15, smoothWheel: true, wheelMultiplier: 0.85 });

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

    const mainTrigger = ScrollTrigger.create({
      trigger: '#story',
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: () => {
        updateSceneMetrics();
      },
    });

    const refresh = () => {
      ScrollTrigger.refresh();
      updateSceneMetrics();
    };

    window.addEventListener('resize', refresh);
    document.fonts?.ready.then(() => {
      if (!cancelled) refresh();
    });

    updateSceneMetrics();

    return () => {
      cancelled = true;
      window.removeEventListener('resize', refresh);
      mainTrigger.kill();
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
  else
    target.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
}
