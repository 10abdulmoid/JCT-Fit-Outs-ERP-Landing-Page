import {
  useActiveChapterId,
  useScrollProgress,
  getCanvasOpacity,
  getMeasuredBoundaryValues,
  useCameraPos,
  useDrawCalls,
} from '../hooks/scroll-store';

export function DebugOverlay() {
  const isDebug =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).has('debug');

  if (!isDebug) return null;

  return <DebugOverlayContent />;
}

function DebugOverlayContent() {
  const progress = useScrollProgress();
  const activeChapterId = useActiveChapterId();
  const opacity = getCanvasOpacity();
  const boundaries = getMeasuredBoundaryValues();
  const camPos = useCameraPos();
  const drawCalls = useDrawCalls();

  return (
    <div
      role="region"
      aria-label="Debug overlay"
      className="fixed bottom-4 left-4 z-50 rounded-lg border border-emerald-500/40 bg-black/90 p-3 font-mono text-[11px] leading-relaxed text-emerald-400 shadow-2xl backdrop-blur-md pointer-events-none select-none max-w-xs"
    >
      <div className="mb-2 font-bold uppercase tracking-wider text-emerald-300 border-b border-emerald-500/30 pb-1 flex justify-between">
        <span>Debug Overlay</span>
        <span className="text-emerald-500">?debug</span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-emerald-500">Scene Progress:</span>
          <span className="font-bold text-white">{progress.toFixed(3)}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-emerald-500">Active Chapter:</span>
          <span className="font-bold text-amber-300">{activeChapterId}</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-emerald-500">Draw Calls:</span>
          <span className="font-bold text-cyan-300">{drawCalls} / 250</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-emerald-500">Camera Pos:</span>
          <span className="font-bold text-emerald-200">
            ({camPos.x.toFixed(1)}, {camPos.y.toFixed(1)}, {camPos.z.toFixed(1)})
          </span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-emerald-500">Canvas Opacity:</span>
          <span className="text-emerald-200">{opacity.toFixed(3)}</span>
        </div>
      </div>

      <div className="mt-2 border-t border-emerald-500/30 pt-1.5 text-[10px]">
        <div className="text-emerald-500 mb-1 font-semibold">Section Boundaries (Scene Progress):</div>
        <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-emerald-300">
          <span>#top: {boundaries.top.toFixed(2)}</span>
          <span>#plan: {boundaries.plan.toFixed(2)}</span>
          <span>#inside: {boundaries.inside.toFixed(2)}</span>
          <span>#explode: {boundaries.explode.toFixed(2)}</span>
          <span className="col-span-2">#portals: {boundaries.portals.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
