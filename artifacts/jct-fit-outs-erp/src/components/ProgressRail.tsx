import { useEffect, useState } from 'react';
import { CHAPTER_STOPS, useActiveChapterIndex, useScrollProgress, scrollToChapter } from '../hooks/scroll-store';

export function ProgressRail() {
  const activeIndex = useActiveChapterIndex();
  const progress = useScrollProgress();
  const currentChapter = CHAPTER_STOPS[activeIndex] || CHAPTER_STOPS[0];
  const [isLightPanel, setIsLightPanel] = useState(false);

  useEffect(() => {
    const lightPanels = document.querySelectorAll('.light-panel');
    if (lightPanels.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const isIntersecting = entries.some((entry) => entry.isIntersecting);
        setIsLightPanel(isIntersecting);
      },
      {
        rootMargin: '-5px 0px -85% 0px',
        threshold: 0,
      }
    );

    lightPanels.forEach((panel) => observer.observe(panel));
    return () => observer.disconnect();
  }, []);

  return (
    <>
      <div className="progress-rail hidden sm:flex" role="navigation" aria-label="Page chapters">
        {CHAPTER_STOPS.map(([id, label], index) => (
          <button
            key={id}
            className="progress-dot"
            type="button"
            aria-label={`Go to ${label}`}
            aria-current={activeIndex === index ? 'step' : undefined}
            onClick={() => scrollToChapter(id)}
          />
        ))}
      </div>

      <div
        className={`fixed top-20 right-6 z-30 hidden md:flex items-center gap-3 px-3.5 py-1.5 rounded-full border backdrop-blur-md text-[10px] mono pointer-events-none select-none transition-colors duration-200 ${
          isLightPanel
            ? 'bg-white border-[#cbd5e1] text-[#2a55a8]'
            : 'bg-black/40 border-white/10 text-white/80'
        }`}
        aria-label="Scene HUD"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
        <span className={`uppercase font-semibold tracking-wider ${isLightPanel ? 'text-[#2a55a8]' : 'text-white'}`}>
          {currentChapter[1]}
        </span>
        <span className={isLightPanel ? 'text-[#2a55a8]/40' : 'text-white/40'}>/</span>
        <span className={`font-mono ${isLightPanel ? 'text-[#2a55a8]' : 'text-[#60a5fa]'}`}>
          {Math.round(progress * 100)}%
        </span>
      </div>
    </>
  );
}
