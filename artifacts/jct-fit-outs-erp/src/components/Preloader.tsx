import { useEffect, useState } from 'react';

export function Preloader() {
  const [value, setValue] = useState(0);
  const [done, setDone] = useState(false);
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(100);
      setDone(true);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const amount = Math.min(100, Math.round(((now - start) / 600) * 100));
      setValue(amount);
      if (amount < 100) frame = requestAnimationFrame(tick);
      else window.setTimeout(() => setDone(true), 120);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);
  if (done) return null;
  return <div className="fixed inset-0 z-[100] flex flex-col justify-between bg-[#101f26] px-7 py-8 text-white md:px-12 md:py-10" role="status" aria-label="Preparing the blueprint experience">
    <div className="flex items-center gap-3"><span className="border border-white/40 px-2 py-1 text-[10px] font-bold">JCT</span><span className="eyebrow text-white/65">Fit-outs ERP</span></div>
    <div className="mx-auto w-full max-w-[520px]">
      <div className="mb-4 flex items-end justify-between"><span className="eyebrow text-white/50">Preparing the drawing</span><span className="mono text-sm">{String(value).padStart(3, '0')}%</span></div>
      <div className="h-px bg-white/15"><div className="h-px bg-[#60a5fa] transition-[width] duration-100" style={{ width: `${value}%` }} /></div>
    </div>
    <div className="mono text-[9px] text-white/40">PROJECT FLOW / 001</div>
  </div>;
}