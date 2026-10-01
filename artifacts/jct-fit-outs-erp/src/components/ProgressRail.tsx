import { useScrollProgress, scrollToChapter } from '../hooks/scroll-store';

const stops = [
  ['top', 'Hero'], ['plan', 'Plan it'], ['inside', 'Inside'], ['explode', 'ERP modules'], ['portals', 'Portals'], ['finance', 'Financial control'], ['demo', 'Book a demo'],
] as const;

export function ProgressRail() {
  const progress = useScrollProgress();
  const activeIndex = Math.min(stops.length - 1, Math.floor(progress * stops.length));
  return <div className="progress-rail hidden sm:flex" role="navigation" aria-label="Page chapters">
    {stops.map(([id, label], index) => <button key={id} className="progress-dot" type="button" aria-label={`Go to ${label}`} aria-current={activeIndex === index ? 'step' : undefined} onClick={() => scrollToChapter(id)} />)}
  </div>;
}