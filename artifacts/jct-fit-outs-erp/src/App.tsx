import { useEffect } from 'react';
import gsap from 'gsap';
import { SceneGate } from './Scene/SceneGate';
import { Cursor } from './components/Cursor';
import { DebugOverlay } from './components/DebugOverlay';
import { Preloader } from './components/Preloader';
import { ProgressRail } from './components/ProgressRail';
import { SiteNav } from './components/SiteNav';
import { useLenisGsap } from './hooks/scroll-store';
import {
  CapabilityStrip,
  DemoSection,
  ExplodeChapter,
  FinanceSection,
  HeroChapter,
  InsideChapter,
  Marquee,
  PlanChapter,
  PortalsSection,
  PricingSection,
  SiteFooter,
} from './sections/StorySections';

function App() {
  useLenisGsap();
  useEffect(() => {
    const buttons = Array.from(document.querySelectorAll<HTMLElement>('.magnetic'));
    const cleanups = buttons.map((button) => {
      const move = (event: MouseEvent) => {
        if (window.matchMedia('(pointer: coarse)').matches) return;
        const rect = button.getBoundingClientRect();
        const dx = (event.clientX - (rect.left + rect.width / 2)) * .09;
        const dy = (event.clientY - (rect.top + rect.height / 2)) * .12;
        gsap.to(button, { x: dx, y: dy, duration: .32, ease: 'power3.out' });
      };
      const leave = () => gsap.to(button, { x: 0, y: 0, duration: .55, ease: 'elastic.out(1,.45)' });
      button.addEventListener('mousemove', move);
      button.addEventListener('mouseleave', leave);
      return () => { button.removeEventListener('mousemove', move); button.removeEventListener('mouseleave', leave); };
    });
    return () => cleanups.forEach((cleanup) => cleanup());
  }, []);
  return (
    <div className="site-shell site-noise">
      <a className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[120] focus:bg-white focus:px-4 focus:py-3 focus:text-[#18181b]" href="#main-content">Skip to content</a>
      <SceneGate />
      <div aria-hidden="true" className="scene-wash" />
      <SiteNav />
      <ProgressRail />
      <DebugOverlay />
      <Preloader />
      <Cursor />
      <main id="main-content">
        <div id="story">
          <HeroChapter />
          <PlanChapter />
          <InsideChapter />
          <ExplodeChapter />
          <Marquee />
          <PortalsSection />
          <FinanceSection />
          <PricingSection />
          <CapabilityStrip />
          <DemoSection />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

export default App;