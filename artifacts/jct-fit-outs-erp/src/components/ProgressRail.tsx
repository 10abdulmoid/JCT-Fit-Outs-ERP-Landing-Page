import { CHAPTER_STOPS, useActiveChapterIndex, scrollToChapter } from '../hooks/scroll-store';

export function ProgressRail() {
  const activeIndex = useActiveChapterIndex();
  return (
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
  );
}
