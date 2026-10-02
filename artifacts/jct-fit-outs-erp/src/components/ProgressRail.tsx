import { CHAPTER_STOPS, useActiveChapterIndex, useScrollProgress, scrollToChapter } from '../hooks/scroll-store';

export function ProgressRail() {
  const activeIndex = useActiveChapterIndex();
  const progress = useScrollProgress();
  const currentChapter = CHAPTER_STOPS[activeIndex] || CHAPTER_STOPS[0];

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
        className="fixed top-20 right-6 z-30 hidden md:flex items-center gap-3 px-3 py-1.5 rounded-full border border-white/10 bg-black/40 backdrop-blur-md text-[10px] mono text-white/80 pointer-events-none select-none"
        aria-label="Scene HUD"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#3b82f6] animate-pulse" />
        <span className="uppercase font-semibold tracking-wider text-white">{currentChapter[1]}</span>
        <span className="text-white/40">/</span>
        <span className="text-[#60a5fa] font-mono">{Math.round(progress * 100)}%</span>
      </div>
    </>
  );
}
