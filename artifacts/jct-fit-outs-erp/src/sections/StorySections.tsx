import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type HTMLAttributes, type MouseEvent } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, ChevronRight } from 'lucide-react';
import { getScrollVelocity, useScrollProgress } from '../hooks/scroll-store';
import { useAuthUrl } from '../hooks/use-auth-url';

gsap.registerPlugin(ScrollTrigger, SplitText);

function RevealHeading({ children, className = '', ...props }: HTMLAttributes<HTMLHeadingElement>) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const split = new SplitText(node, { type: 'lines', linesClass: 'reveal-line' });
    const animation = gsap.from(split.lines, {
      yPercent: 110, opacity: 0, duration: .95, stagger: .08, ease: 'power3.out',
      scrollTrigger: { trigger: node, start: 'top 84%', once: true },
    });
    return () => { animation.scrollTrigger?.kill(); animation.kill(); split.revert(); };
  }, []);
  return <h2 ref={ref} className={className} {...props}>{children}</h2>;
}

function ChapterLabel({ number, label, light = false }: { number: string; label: string; light?: boolean }) {
  return (
    <p className={`eyebrow flex items-center gap-3 ${light ? 'text-[#2a55a8]' : 'text-white/85'}`}>
      <span>{number}</span>
      <span className={`h-px w-8 ${light ? 'bg-[#2a55a8]/60' : 'bg-white/40'}`} />
      {label}
    </p>
  );
}

function HeroTitle() {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const node = ref.current;
    if (!node || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const split = new SplitText(node, { type: 'lines', linesClass: 'reveal-line', mask: 'lines' });
    const reveal = gsap.from(split.lines, { yPercent: 110, opacity: 0, duration: 1.1, stagger: .12, delay: 1.2, ease: 'power3.out' });
    return () => { reveal.kill(); split.revert(); };
  }, []);
  return <h1 ref={ref} className="hero-title display mt-8 max-w-[1050px] text-[#f3f5fa]">From first lead<br />to <em>final account.</em></h1>;
}

export function HeroChapter() {
  const auth = useAuthUrl();

  return (
    <section id="top" className="hero-section dark-chapter px-6 md:px-[8.5vw]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[8.5vw] top-[27%] hidden h-[43vh] w-px bg-gradient-to-b from-transparent via-white/20 to-transparent md:block" />
        <div className="absolute right-[10vw] top-[27%] hidden h-[43vh] w-px bg-gradient-to-b from-transparent via-white/20 to-transparent md:block" />
      </div>
      <div className="relative z-10 w-full pt-16">
        <ChapterLabel number="JCT / SYSTEM 01" label="Project lifecycle, connected" />
        <HeroTitle />
        <p className="mt-7 max-w-[470px] text-sm leading-7 text-white/85 md:text-base">One platform for the whole fit-out lifecycle.</p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <a href="#demo" data-cursor="Open" className="magnetic btn-primary inline-flex items-center gap-8 px-5 py-4 text-[12px] font-semibold">Book a demo <ArrowUpRight size={15} /></a>
          <a
            href={auth.url}
            aria-disabled={auth.isDisabled}
            tabIndex={auth.isDisabled ? -1 : undefined}
            onClick={auth.isDisabled ? (e) => e.preventDefault() : undefined}
            className={`magnetic btn-ghost inline-flex items-center gap-7 px-5 py-4 text-[12px] font-medium ${auth.isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            Sign in <ArrowUpRight size={15} />
          </a>
        </div>
      </div>
      <a href="#plan" className="absolute bottom-9 left-6 flex items-center gap-3 text-[9px] uppercase tracking-[.18em] text-white/70 md:left-[8.5vw]">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-white/40"><ArrowDown size={13} /></span> Scroll to move from plan to built
      </a>
      <span className="mono absolute bottom-10 right-[8.5vw] hidden text-[9px] text-white/60 md:block">BLUEPRINT / BUILT</span>
    </section>
  );
}

export function PlanChapter() {
  return (
    <section id="plan" className="chapter-shell dark-chapter px-6 md:px-[8.5vw]">
      <span className="outlined-number pointer-events-none absolute -left-4 top-[17%]">01</span>
      <div className="relative z-10 grid w-full items-center gap-12 md:grid-cols-[.8fr_1.2fr]">
        <div className="max-w-[510px] md:pt-16">
          <ChapterLabel number="01" label="Plan it" />
          <RevealHeading className="chapter-title display mt-7 text-white">Every project<br />starts <em>here.</em></RevealHeading>
          <p className="mt-6 max-w-[430px] text-sm leading-7 text-white/85">Capture the lead, record the site visit, and turn measured scope into a BOQ—before the project leaves the drawing board.</p>
          <div className="mt-8 grid max-w-[440px] grid-cols-3 border-y border-white/20 py-4">
            {['Lead capture', 'Site visits', 'BOQ'].map((step, index) => <div key={step} className="border-r border-white/15 px-2 last:border-0 first:pl-0"><span className="mono block text-[9px] text-[#78aaff]">0{index + 1}</span><span className="mt-2 block text-[11px] text-white/90">{step}</span></div>)}
          </div>
        </div>
        <div className="relative hidden h-[390px] md:block">
          <div className="absolute right-0 top-4 w-[min(42vw,560px)] border border-white/20 bg-[#111f2a]/55 p-5 backdrop-blur-[3px]">
            <div className="flex justify-between border-b border-white/15 pb-3"><span className="eyebrow text-white/85">Fit-out / floor plan</span><span className="mono text-[9px] text-[#78aaff]">DRAWING / BOQ</span></div>
            <svg viewBox="0 0 460 280" className="mt-4 w-full" role="img" aria-label="Architectural floor plan drawing with room divisions">
              <g fill="none" stroke="#8abaff" strokeWidth="1">
                <path d="M32 25h397v225H32zM32 155h125v95M157 155h100v95M257 25v110M257 135h172M321 135v115M157 25v93M157 118h100" />
                <path d="M32 117h25m45 0h55m-100 0a25 25 0 0 1 25 25M257 82h40m38 0h94m-94 0a38 38 0 0 1 38 38M257 207h35m42 0h73" strokeDasharray="3 4" />
              </g>
              <g fill="#8abaff" fontSize="7" fontFamily="monospace"><text x="56" y="91">MEETING</text><text x="185" y="70">WORKSPACE</text><text x="70" y="211">RECEPTION</text><text x="343" y="190">CLIENT ROOM</text></g>
              <path d="M19 260h425" stroke="#c4845a" strokeWidth=".6" /><text x="20" y="273" fill="#c4845a" fontSize="7" fontFamily="monospace">SITE MEASUREMENT / QUANTITY SURVEYING</text>
            </svg>
            <div className="flex justify-between pt-3 text-[9px] text-white/60"><span>QS MEASUREMENT / REVIEW</span><span>JCT — 0147</span></div>
          </div>
        </div>
      </div>
    </section>
  );
}

const process = ['Lead', 'Site visit', 'BOQ', 'Client approval', 'Schedule', 'Billing'];
export function InsideChapter() {
  const progress = useScrollProgress();
  const scrollActive = Math.min(5, Math.max(0, Math.floor((progress - .35) / .038)));
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const active = selectedStep ?? scrollActive;

  return (
    <section id="inside" className="chapter-shell dark-chapter px-6 md:px-[8.5vw]">
      <div className="relative z-10 grid w-full items-center gap-10 md:grid-cols-[.78fr_1.22fr]">
        <div className="max-w-[460px]">
          <ChapterLabel number="02" label="Inside the project" />
          <RevealHeading className="chapter-title display mt-7 text-white">One clear<br />line of <em>progress.</em></RevealHeading>
          <p className="mt-6 max-w-[400px] text-sm leading-7 text-white/85">Move from approved scope to Gantt / CPM scheduling, validate progress and connect the plan to milestone billing.</p>
          <div className="mt-10 flex items-center gap-4">
            <span className="display text-5xl text-[#60a5fa]">{String(active + 1).padStart(2, '0')}</span>
            <span className="h-px w-10 bg-white/30" />
            <div>
              <span className="eyebrow text-white/80">Project sequence</span>
              <p className="mt-1 text-[15px] font-semibold text-white">{process[active]}</p>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2">
            {process.map((step, idx) => (
              <button
                key={step}
                type="button"
                onClick={() => setSelectedStep(idx === selectedStep ? null : idx)}
                className={`px-3 py-1.5 text-[10px] mono uppercase rounded border transition-colors ${idx === active ? 'bg-[#3b82f6] text-white border-[#3b82f6]' : 'border-white/20 text-white/70 hover:border-white/50'}`}
              >
                0{idx + 1} {step}
              </button>
            ))}
          </div>
        </div>
        <div className="relative mx-auto flex aspect-square w-full max-w-[530px] items-center justify-center">
          <div className="absolute inset-[7%] rounded-full border border-white/10" />
          <div className="absolute inset-[18%] rounded-full border border-dashed border-white/15" />
          <div className="absolute h-[1px] w-full bg-white/10" /><div className="absolute h-full w-[1px] bg-white/10" />
          <div className="relative flex h-[66%] w-[77%] rotate-[-9deg] items-center justify-center border border-[#85b5fa]/80 bg-[#24363b]/75 shadow-[0_0_60px_rgba(59,130,246,.16)]">
            <div className="absolute inset-[9%] border border-white/20" />
            <div className="absolute left-[50%] top-[9%] h-[55%] w-px bg-white/50" />
            <div className="absolute left-[9%] top-[64%] h-px w-[82%] bg-white/50" />
            <div className="absolute left-[31%] top-[9%] h-[55%] w-px bg-white/35" />
            <div className="absolute bottom-[11%] right-[10%] h-[25%] w-[26%] bg-[#71816f]/50" />
            <div className="absolute left-[14%] top-[19%] h-[13%] w-[27%] bg-[#a98b70]/50" />
            {process.map((step, index) => (
              <button
                key={step}
                type="button"
                onClick={() => setSelectedStep(index === selectedStep ? null : index)}
                className={`absolute flex items-center gap-2 cursor-pointer transition-all duration-300 ${index === active ? 'scale-110 text-white font-bold' : 'text-white/45 hover:text-white/80'}`}
                style={{ left: `${9 + (index % 3) * 28}%`, top: `${14 + Math.floor(index / 3) * 48}%` }}
              >
                <span className={`h-2.5 w-2.5 rounded-full transition-all ${index === active ? 'bg-[#60a5fa] shadow-[0_0_14px_#60a5fa]' : 'bg-white/35'}`} />
                <span className="mono text-[8px] uppercase">{step}</span>
              </button>
            ))}
          </div>
          <span className="mono absolute bottom-1 right-0 text-[8px] text-white/60">LIVE PROJECT / SEQUENCE 0{active + 1}</span>
        </div>
      </div>
    </section>
  );
}

const layers = [
  ['CRM', 'Lead capture and site visits move into a live project record.'],
  ['BOQ & Estimating', 'Quantity surveying and BOQ approval in the client portal.'],
  ['Scheduling', 'Gantt / CPM planning with progress validation.'],
  ['Procurement & Stock', 'RFQs, quotes, award packs and stock in one flow.'],
  ['Finance & P&L', 'Claims, certificates, retention, billing and project P&L.'],
];
export function ExplodeChapter() {
  const [active, setActive] = useState(0);
  return (
    <section id="explode" className="chapter-shell dark-chapter px-6 md:px-[8.5vw]">
      <span className="outlined-number pointer-events-none absolute right-0 top-[14%]">03</span>
      <div className="relative z-10 grid w-full gap-8 md:grid-cols-[.85fr_1.15fr]">
        <div className="self-center">
          <ChapterLabel number="03" label="The whole operation" />
          <RevealHeading className="chapter-title display mt-7 text-white">One project.<br /><em>Every layer.</em></RevealHeading>
          <p className="mt-6 max-w-[380px] text-sm leading-7 text-white/85">Connect the operational layers that take a fit-out from first conversation through close-out.</p>
          <div className="mt-8 max-w-[440px] border-t border-white/20 pt-5">
            <p className="eyebrow text-[#78aaff]">{layers[active][0]}</p>
            <p className="mt-2 max-w-[360px] text-xs leading-6 text-white/85">{layers[active][1]}</p>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-2 md:pl-[10%]">
          {layers.map(([name], index) => <button key={name} type="button" onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)} className={`group flex items-center gap-4 border-b border-white/20 py-4 text-left transition-all ${active === index ? 'translate-x-2 text-white' : 'text-white/65'}`} aria-pressed={active === index}>
            <span className="mono w-7 text-[9px] text-[#78aaff]">0{index + 1}</span><span className="h-px w-8 bg-[#78aaff]/50 transition-all group-hover:w-14" /><span className="flex-1 text-sm font-medium">{name}</span><ChevronRight size={15} className={active === index ? 'text-[#78aaff]' : 'opacity-0'} />
          </button>)}
        </div>
      </div>
    </section>
  );
}

export function Marquee() {
  const words = ['Leads', 'BOQ', 'Schedule', 'Procurement', 'Billing', 'Variations', 'P&L'];
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const track = trackRef.current;
    if (!track || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const motion = gsap.to(track, { xPercent: -50, duration: 30, repeat: -1, ease: 'none' });
    const respondToScroll = () => {
      const velocity = getScrollVelocity();
      motion.timeScale(Math.min(2.8, Math.max(.7, 1 + Math.abs(velocity) * .35)));
      motion.reversed(velocity < -.03);
      gsap.to(track, { skewX: Math.max(-4, Math.min(4, velocity * -.65)), duration: .35, overwrite: true });
    };
    window.addEventListener('scroll', respondToScroll, { passive: true });
    return () => { window.removeEventListener('scroll', respondToScroll); motion.kill(); };
  }, []);
  return (
    <div role="region" aria-label="Key features marquee" className="marquee dark-chapter py-5">
      <div ref={trackRef} className="marquee-track" aria-hidden="true">{[...words, ...words].map((word, index) => <span key={index} className="marquee-word">{word}<span className="ml-10 text-[.42em] text-[#c4845a]">/</span></span>)}</div>
    </div>
  );
}

const portalData: [string, string[]][] = [
  ['Director', ['Project and company P&L', 'Configurable approval matrices', 'Audit trail']],
  ['Project Manager', ['Gantt / CPM scheduling', 'Progress validation', 'Variation control']],
  ['QS', ['Quantity surveying', 'BOQ generation', 'Progress claims']],
  ['Finance', ['Milestone billing', 'Certificates + retention', 'QuickBooks sync']],
  ['Site Engineer', ['Site visits', 'Progress validation', 'Project updates']],
  ['Client', ['Design / BOQ approval', 'Variation approval', 'Client portal']],
  ['Subcontractor', ['RFQ invitations', 'Quote submission', 'Award packs']],
  ['Admin', ['Role-based access', 'Approval matrices', 'Audit trail + dark mode']],
];
function PortalMock({ index }: { index: number }) {
  const roleUis = [
    // Director
    <div key={0} className="space-y-2">
      <div className="flex justify-between items-center bg-[#2a55a8]/10 p-2 rounded text-[9px] font-mono">
        <span>COMPANY P&L MARGIN</span>
        <span className="text-emerald-600 font-bold">+24.8%</span>
      </div>
      <div className="h-12 bg-white/80 border border-[#2a55a8]/15 rounded p-2 flex items-end gap-1">
        {[40, 65, 55, 80, 95, 85].map((h, i) => (
          <div key={i} className="flex-1 bg-[#3b82f6]/60 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>,
    // PM
    <div key={1} className="space-y-1.5">
      <div className="text-[8px] font-mono text-[#2a55a8] flex justify-between">
        <span>GANTT / CRITICAL PATH</span>
        <span>82% ON TIME</span>
      </div>
      {['M&E First Fix', 'Partition Walls', 'Ceiling Grid', 'Joinery'].map((task, i) => (
        <div key={task} className="flex items-center gap-2 text-[8px] bg-white/70 p-1 rounded border border-[#2a55a8]/10">
          <span className="w-16 truncate font-medium">{task}</span>
          <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
            <div className="bg-[#3b82f6] h-full rounded-full" style={{ width: `${(i + 1) * 22}%` }} />
          </div>
        </div>
      ))}
    </div>,
    // QS
    <div key={2} className="space-y-1.5">
      <div className="text-[8px] font-mono text-[#2a55a8] flex justify-between">
        <span>BOQ MEASUREMENT</span>
        <span>AED 1.2M</span>
      </div>
      <div className="border border-[#2a55a8]/15 rounded bg-white/90 overflow-hidden text-[8px]">
        <div className="grid grid-cols-3 bg-[#2a55a8]/10 p-1 font-bold"><span>ITEM</span><span>QTY</span><span>RATE</span></div>
        <div className="grid grid-cols-3 p-1 border-b border-gray-100"><span>1.1 Drywall</span><span>450m²</span><span>120</span></div>
        <div className="grid grid-cols-3 p-1"><span>1.2 Glass Partition</span><span>120m²</span><span>480</span></div>
      </div>
    </div>,
    // Finance
    <div key={3} className="space-y-1.5">
      <div className="text-[8px] font-mono text-[#2a55a8] flex justify-between">
        <span>MILESTONE INVOICING</span>
        <span className="text-[#3b82f6] font-bold">QBO SYNC OK</span>
      </div>
      <div className="bg-white/80 p-2 rounded border border-[#2a55a8]/15 space-y-1">
        <div className="flex justify-between text-[8px]"><span>Cert #04 Submitted</span><span className="font-mono font-bold">AED 340,000</span></div>
        <div className="flex justify-between text-[7px] text-gray-500"><span>Retention 10% Held</span><span>AED 34,000</span></div>
      </div>
    </div>,
    // Site Engineer
    <div key={4} className="space-y-1.5">
      <div className="text-[8px] font-mono text-[#2a55a8] flex justify-between">
        <span>SITE INSPECTION</span>
        <span className="text-emerald-600">PASSED</span>
      </div>
      {['M&E Rough-in check', 'Acoustic insulation audit'].map((chk) => (
        <div key={chk} className="flex items-center gap-2 bg-white/80 p-1.5 rounded text-[8px] border border-[#2a55a8]/10">
          <Check className="w-3 h-3 text-emerald-600" />
          <span>{chk}</span>
        </div>
      ))}
    </div>,
    // Client
    <div key={5} className="space-y-1.5">
      <div className="text-[8px] font-mono text-[#2a55a8] flex justify-between">
        <span>VARIATION APPROVAL</span>
        <span className="bg-amber-100 text-amber-800 px-1 rounded">PENDING</span>
      </div>
      <div className="bg-white/90 p-2 rounded border border-[#2a55a8]/15 text-[8px]">
        <p className="font-semibold">VO-03: Acoustic Glass Upgrade</p>
        <p className="text-gray-500 mt-0.5">+AED 28,500 | +2 Days Impact</p>
      </div>
    </div>,
    // Subcontractor
    <div key={6} className="space-y-1.5">
      <div className="text-[8px] font-mono text-[#2a55a8] flex justify-between">
        <span>RFQ INVITATION</span>
        <span>AWARDED</span>
      </div>
      <div className="bg-white/80 p-2 rounded border border-[#2a55a8]/15 text-[8px] space-y-1">
        <div className="flex justify-between"><span>Package: Joinery & Fitments</span><span className="font-bold">AED 210,000</span></div>
        <div className="text-[7px] text-emerald-600">✓ Award letter issued</div>
      </div>
    </div>,
    // Admin
    <div key={7} className="space-y-1.5">
      <div className="text-[8px] font-mono text-[#2a55a8] flex justify-between">
        <span>ACCESS & APPROVALS</span>
        <span>MATRIX ACTIVE</span>
      </div>
      <div className="bg-white/90 p-1.5 rounded border border-[#2a55a8]/15 text-[8px] space-y-1">
        <div className="flex justify-between items-center"><span>VO Approval Threshold</span><span className="font-mono bg-gray-100 px-1 rounded">&gt; AED 50k</span></div>
        <div className="flex justify-between items-center"><span>Audit Trail Log</span><span className="text-emerald-600 font-mono">ENABLED</span></div>
      </div>
    </div>
  ];

  return (
    <div className="mini-panel mt-7" aria-hidden="true">
      <div className="mb-3 flex items-center justify-between">
        <span className="mono text-[7px] text-[#2a55a8]">JCT / PORTAL {String(index + 1).padStart(2, '0')}</span>
        <span className="h-2 w-2 rounded-full bg-[#2dd4bf]" />
      </div>
      <div className="min-h-[105px]">
        {roleUis[index % roleUis.length]}
      </div>
      <div className="mt-3 flex justify-between border-t border-[#2a55a8]/15 pt-2">
        <span className="mono text-[7px] text-[#2a55a8]">ROLE WORKSPACE</span>
        <span className="h-1 w-10 rounded bg-[#3b82f6]/35" />
      </div>
    </div>
  );
}

export function PortalsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const section = sectionRef.current;
    const track = trackRef.current;
    if (!section || !track || window.matchMedia('(max-width: 767px)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const tween = gsap.to(track, { x: () => -(track.scrollWidth - window.innerWidth + 80), ease: 'none', scrollTrigger: { trigger: section, start: 'top top', end: () => `+=${track.scrollWidth - window.innerWidth + 120}`, scrub: 1, pin: true, anticipatePin: 1, invalidateOnRefresh: true } });
    return () => { tween.scrollTrigger?.kill(); tween.kill(); };
  }, []);
  const tilt = (event: MouseEvent<HTMLElement>) => {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    const box = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - box.left) / box.width - .5;
    const y = (event.clientY - box.top) / box.height - .5;
    event.currentTarget.style.setProperty('--glare-x', `${(x + .5) * 100}%`);
    event.currentTarget.style.setProperty('--glare-y', `${(y + .5) * 100}%`);
    event.currentTarget.style.transform = `perspective(900px) rotateY(${x * 5}deg) rotateX(${-y * 5}deg)`;
  };
  return (
    <section id="portals" ref={sectionRef} className="light-panel relative flex min-h-[100svh] flex-col justify-center overflow-hidden py-20">
      <div className="mb-10 px-6 md:px-[8.5vw]">
        <ChapterLabel number="04" label="One project / eight role portals" light />
        <div className="mt-5 flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <RevealHeading className="chapter-title display max-w-[740px] text-[#18181b]">The right view<br />for <em>every role.</em></RevealHeading>
          <p className="max-w-[310px] text-xs leading-6 text-[#3d4858]">Role-based access gives each person a clear place in the fit-out lifecycle.</p>
        </div>
      </div>
      <div className="overflow-x-auto pb-5 md:overflow-visible" role="region" aria-label="Role portal carousel" aria-roledescription="carousel" tabIndex={0}>
        <div ref={trackRef} className="portals-track px-6 md:px-[8.5vw]">
          {portalData.map(([role, bullets], index) => <article key={role} tabIndex={0} data-cursor="DRAG" className="portal-card" onMouseMove={tilt} onMouseLeave={(event) => { event.currentTarget.style.transform = ''; }}>
            <div className="flex items-start justify-between"><span className="mono text-[9px] text-[#2a55a8]">PORTAL / {String(index + 1).padStart(2, '0')}</span><ArrowUpRight size={15} className="text-[#2a55a8]" /></div>
            <h3 className="display mt-5 text-[29px] leading-tight text-[#18181b]">{role}</h3>
            <ul className="mt-4 space-y-2">{bullets.map((bullet) => <li key={bullet} className="flex items-start gap-2 text-[10px] leading-4 text-[#374151]"><span className="mt-[6px] h-1 w-1 rounded-full bg-[#3b82f6]" />{bullet}</li>)}</ul>
            <PortalMock index={index} />
          </article>)}
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between px-6 md:px-[8.5vw]">
        <span className="eyebrow text-[#2a55a8]">Swipe to explore the role portals</span>
        <div className="hidden items-center gap-2 md:flex"><span className="mono text-[8px] text-[#2a55a8]">DRAG / SCROLL</span><ArrowRight size={14} className="text-[#2a55a8]" /></div>
        <div className="mono md:hidden text-[8px] text-[#2a55a8]">01 — 08</div>
      </div>
    </section>
  );
}

const financeSteps = [
  { name: 'BOQ', desc: 'Initial baseline budget & scope items created from site survey.' },
  { name: 'Variation', desc: 'Site change requests & variations logged with impact cost.' },
  { name: 'Client approval', desc: 'Digital client sign-off via portal with full audit trail.' },
  { name: 'Re-baseline', desc: 'Contract scope & timeline auto-updated across all schedules.' },
  { name: 'Invoice', desc: 'Milestone progress claims & retention certificates generated.' },
  { name: 'QuickBooks', desc: 'Direct 2-way sync of ledger entries, invoices, and payments.' },
  { name: 'P&L', desc: 'Real-time project & company gross margin tracking.' },
];

export function FinanceSection() {
  const container = useRef<HTMLElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    if (!container.current || !svg.current || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const path = svg.current.querySelector<SVGPathElement>('.finance-path');
    const nodes = svg.current.querySelectorAll('.finance-node');
    const length = path?.getTotalLength() || 1;
    if (path) { path.setAttribute('stroke-dasharray', `${length}`); path.setAttribute('stroke-dashoffset', `${length}`); }
    const tween = gsap.to(path, { strokeDashoffset: 0, ease: 'none', scrollTrigger: { trigger: container.current, start: 'top 65%', end: 'bottom 60%', scrub: 1 } });
    const nodeTween = gsap.fromTo(nodes, { scale: .4, opacity: .25, transformOrigin: 'center' }, { scale: 1, opacity: 1, stagger: .12, ease: 'back.out(1.7)', scrollTrigger: { trigger: container.current, start: 'top 62%', end: 'bottom 55%', scrub: .8 } });
    return () => { tween.scrollTrigger?.kill(); nodeTween.scrollTrigger?.kill(); tween.kill(); nodeTween.kill(); };
  }, []);

  return (
    <section id="finance" ref={container} className="light-panel relative px-6 py-24 md:px-[8.5vw] md:py-32">
      <div className="grid gap-12 md:grid-cols-[.75fr_1.25fr]">
        <div>
          <ChapterLabel number="05" label="Financial control" light />
          <RevealHeading className="chapter-title display mt-7 text-[#18181b]">Changes,<br />kept in <em>control.</em></RevealHeading>
          <p className="mt-6 max-w-[360px] text-sm leading-7 text-[#374151]">Control change requests through client approval and re-baselining, then connect progress claims, payment certificates with retention, billing, QuickBooks sync and project / company P&L through close-out.</p>

          <div className="mt-8 rounded-lg border border-[#2a55a8]/20 bg-white/80 p-4 shadow-sm">
            <div className="flex items-center gap-2 text-[10px] font-mono text-[#2a55a8] uppercase font-semibold">
              <span className="h-2 w-2 rounded-full bg-[#3b82f6]" />
              0{activeStep + 1} — {financeSteps[activeStep].name}
            </div>
            <p className="mt-2 text-xs leading-5 text-[#18181b]">
              {financeSteps[activeStep].desc}
            </p>
          </div>

          <div className="mt-6 flex items-center gap-3 border-t border-[#2a55a8]/20 pt-5">
            <span className="h-2 w-2 rounded-full bg-[#2dd4bf]" />
            <span className="eyebrow text-[#2a55a8]">Commercial workflow / connected</span>
          </div>
        </div>
        <div className="relative min-h-[450px]">
          <svg ref={svg} className="absolute inset-0 h-full w-full" viewBox="0 0 680 440" preserveAspectRatio="none" aria-hidden="true">
            <path className="finance-path" d="M58 71 C155 71 150 159 247 159 S340 246 437 246 S532 334 625 334" fill="none" stroke="#3b82f6" strokeWidth="2" />
            {[['58','71'],['153','111'],['247','159'],['342','202'],['437','246'],['531','289'],['625','334']].map(([x,y],i) => (
              <g key={i} className="finance-node cursor-pointer" onClick={() => setActiveStep(i)}>
                <circle cx={x} cy={y} r="14" fill={activeStep === i ? '#3b82f6' : '#f3f5fa'} stroke="#3b82f6" strokeWidth="2" />
                <circle cx={x} cy={y} r="5" fill={activeStep === i ? '#ffffff' : '#3b82f6'} />
              </g>
            ))}
          </svg>
          <div className="relative grid h-full grid-cols-2 grid-rows-4 gap-4 py-2 md:grid-cols-4 md:grid-rows-2">
            {financeSteps.map((step, index) => (
              <button
                key={step.name}
                type="button"
                onClick={() => setActiveStep(index)}
                className={`flex flex-col justify-between text-left cursor-pointer p-2 rounded transition-all ${index % 2 ? 'md:mt-24' : ''} ${index === 6 ? 'col-start-2 md:col-start-4' : ''} ${activeStep === index ? 'bg-white shadow-md border border-[#3b82f6]/30' : 'hover:bg-white/40'}`}
              >
                <span className={`mono text-[8px] ${activeStep === index ? 'text-[#3b82f6] font-bold' : 'text-[#2a55a8]'}`}>0{index + 1} / FLOW</span>
                <span className={`mt-8 max-w-[120px] text-[11px] font-semibold leading-5 ${activeStep === index ? 'text-[#3b82f6]' : 'text-[#18181b]'}`}>{step.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function PricingSection() {
  const [annual, setAnnual] = useState(true);

  const plans = [
    {
      name: 'Starter',
      target: 'Specialist contractors & small fit-out teams',
      monthlyPrice: '$299',
      annualPrice: '$249',
      features: [
        'Up to 5 Active Projects',
        '3 Role Portals (QS, PM, Admin)',
        'BOQ & Estimating module',
        'Basic Gantt Scheduling',
        'Standard Email Support',
      ],
      popular: false,
    },
    {
      name: 'Professional',
      target: 'Growing fit-out firms & main contractors',
      monthlyPrice: '$699',
      annualPrice: '$579',
      features: [
        'Up to 20 Active Projects',
        'All 8 Role Portals',
        'Full Commercial & Variation Flow',
        'CPM Scheduling & Baseline Tracking',
        'QuickBooks & Accounting Integration',
        'Subcontractor RFQ & Award Packs',
        'Priority Phone & Chat Support',
      ],
      popular: true,
    },
    {
      name: 'Enterprise',
      target: 'Large scale interior fit-out enterprises',
      monthlyPrice: 'Custom',
      annualPrice: 'Custom',
      features: [
        'Unlimited Active Projects',
        'Unlimited User Accounts & Portals',
        'Custom Approval Matrices & SLA',
        'Dedicated ERP Onboarding Manager',
        'Custom API & ERP Integrations',
        '24/7 Dedicated Support',
      ],
      popular: false,
    },
  ];

  return (
    <section id="pricing" className="light-panel relative border-t border-[#2a55a8]/15 px-6 py-24 md:px-[8.5vw] md:py-32">
      <div className="mb-14 text-center">
        <p className="eyebrow inline-block text-[#2a55a8]">PRICING & PLANS</p>
        <RevealHeading className="chapter-title display mt-4 text-[#18181b]">Simple, transparent <em>pricing.</em></RevealHeading>
        <p className="mx-auto mt-4 max-w-[500px] text-xs leading-6 text-[#374151]">
          Scale your fit-out operations with plans tailored to your team size and project volume.
        </p>

        <div className="mt-8 flex items-center justify-center gap-3">
          <span className={`text-xs ${!annual ? 'font-bold text-[#18181b]' : 'text-gray-500'}`}>Monthly</span>
          <button
            type="button"
            onClick={() => setAnnual(!annual)}
            className="relative h-6 w-11 rounded-full bg-[#2a55a8] p-1 transition-colors"
          >
            <div className={`h-4 w-4 rounded-full bg-white transition-transform ${annual ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
          <span className={`text-xs ${annual ? 'font-bold text-[#18181b]' : 'text-gray-500'}`}>
            Annual <span className="ml-1 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">SAVE 20%</span>
          </span>
        </div>
      </div>

      <div className="grid gap-8 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative flex flex-col justify-between rounded-xl border bg-white/80 p-8 backdrop-blur-sm transition-shadow hover:shadow-lg ${plan.popular ? 'border-[#3b82f6] shadow-md ring-2 ring-[#3b82f6]/20' : 'border-[#2a55a8]/15'}`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#3b82f6] px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-white">
                MOST POPULAR
              </span>
            )}
            <div>
              <h3 className="display text-2xl text-[#18181b]">{plan.name}</h3>
              <p className="mt-2 min-h-[36px] text-[11px] text-[#52525b]">{plan.target}</p>

              <div className="mt-6 border-b border-gray-100 pb-6">
                <span className="display text-4xl font-bold text-[#18181b]">
                  {annual ? plan.annualPrice : plan.monthlyPrice}
                </span>
                {plan.monthlyPrice !== 'Custom' && <span className="text-xs text-gray-500"> / month</span>}
              </div>

              <ul className="mt-6 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-2.5 text-xs text-[#374151]">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#3b82f6]" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <a
              href="#demo"
              className={`mt-8 inline-flex w-full justify-center rounded-lg py-3 text-xs font-semibold transition-colors ${plan.popular ? 'bg-[#3b82f6] text-white hover:bg-[#2563eb]' : 'border border-[#2a55a8]/30 text-[#2a55a8] hover:bg-[#2a55a8]/5'}`}
            >
              Get started with {plan.name}
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CapabilityStrip() {
  return (
    <section className="light-panel blueprint-grid relative border-y border-[#2a55a8]/15 px-6 py-16 md:px-[8.5vw]">
      <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
        {[
          ['8', 'role portals'],
          ['Gantt / CPM', 'scheduling'],
          ['1', 'platform'],
        ].map(([count, label], index) => (
          <div
            key={label}
            className={`flex items-end gap-4 ${index ? 'sm:border-l sm:border-[#2a55a8]/20 sm:pl-8' : ''}`}
          >
            <span
              className={`display tracking-[-.06em] text-[#2a55a8] ${
                count.length > 3
                  ? 'text-2xl sm:text-3xl md:text-4xl font-semibold'
                  : 'text-6xl'
              }`}
            >
              {count}
            </span>
            <span className="eyebrow mb-2 text-[#2a55a8]">{label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

const initial = { name: '', company: '', email: '', phone: '', message: '' };
export function DemoSection() {
  const [values, setValues] = useState(initial);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const update = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValues({ ...values, [event.target.name]: event.target.value });
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) return;
    setError('');
    setSent(true);
  };
  return (
    <section id="demo" className="relative bg-[#101f26] px-6 py-24 text-white md:px-[8.5vw] md:py-32">
      <div className="pointer-events-none absolute inset-0 blueprint-grid opacity-[.13]" />
      <div className="relative mx-auto grid max-w-[1280px] gap-14 md:grid-cols-[.9fr_1.1fr]">
        <div>
          <ChapterLabel number="06" label="Bring it together" />
          <RevealHeading className="chapter-title display mt-7 text-white">Build the whole<br />project <em>in one place.</em></RevealHeading>
          <p className="mt-6 max-w-[390px] text-sm leading-7 text-white/85">See how JCT Fit-Outs ERP can connect your team from first lead to final account.</p>
          <div className="mt-12 flex items-center gap-3"><span className="h-px w-10 bg-[#c4845a]" /><span className="eyebrow text-white/80">Request a product walkthrough</span></div>
        </div>
        <div>
          {sent ? <div className="flex min-h-[440px] flex-col justify-center border border-white/20 p-7 md:p-10" role="status">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border border-[#2dd4bf]/60 text-[#2dd4bf]"><Check size={20} /></span>
            <h3 className="display mt-7 text-4xl">Request noted.</h3>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/85">This demo form is frontend-only. Your details are validated in this browser; no request has been sent.</p>
            <button type="button" className="mt-8 w-fit border-b border-white/40 pb-1 text-xs" onClick={() => { setSent(false); setValues(initial); }}>Submit another request</button>
          </div> : <form onSubmit={submit} className="grid grid-cols-1 gap-4 sm:grid-cols-2" noValidate>
            <label className="eyebrow text-white/85">Name<input className="form-field mt-2 normal-case tracking-normal" name="name" autoComplete="name" placeholder="Your name" required minLength={2} value={values.name} onChange={update} /></label>
            <label className="eyebrow text-white/85">Company<input className="form-field mt-2 normal-case tracking-normal" name="company" autoComplete="organization" placeholder="Company name" required minLength={2} value={values.company} onChange={update} /></label>
            <label className="eyebrow text-white/85">Work email<input className="form-field mt-2 normal-case tracking-normal" name="email" type="email" autoComplete="email" placeholder="name@company.com" required value={values.email} onChange={update} /></label>
            <label className="eyebrow text-white/85">Phone <span className="normal-case tracking-normal text-white/60">(optional)</span><input className="form-field mt-2 normal-case tracking-normal" name="phone" type="tel" autoComplete="tel" placeholder="+971 ..." value={values.phone} onChange={update} /></label>
            <label className="eyebrow text-white/85 sm:col-span-2">What would you like to manage?<textarea className="form-field mt-2 min-h-[100px] resize-y normal-case tracking-normal" name="message" placeholder="Tell us about your fit-out workflow" required minLength={10} value={values.message} onChange={update} /></label>
            {error && <p className="text-sm text-[#ffb4a6]" role="alert">{error}</p>}
            <div className="flex flex-col items-start gap-4 pt-2 sm:col-span-2 sm:flex-row sm:items-center">
              <button type="submit" className="magnetic btn-primary inline-flex items-center gap-8 px-5 py-4 text-xs font-semibold">Request a demo <ArrowUpRight size={14} /></button>
              <span className="text-[10px] leading-5 text-white/60">Frontend demo only — no information is sent or stored.</span>
            </div>
          </form>}
        </div>
      </div>
    </section>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#101f26] px-6 pb-8 text-white md:px-[8.5vw]">
      <div className="mx-auto max-w-[1280px] border-t border-white/20 pt-8">
        <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <a href="#top" className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center border border-white/50 text-[10px] font-bold">JCT</span><span className="eyebrow text-white/80">Fit-Outs ERP</span></a>
          <div className="flex gap-6 text-[11px] text-white/85"><a className="nav-link" href="#plan">Platform</a><a className="nav-link" href="#portals">Portals</a><a className="nav-link" href="#demo">Book a demo</a></div>
        </div>
        <div className="display mt-14 select-none text-[17vw] leading-[.76] tracking-[-.1em] text-white/[.09] md:mt-20">JCT<span className="text-[#c4845a]/35">/</span>ERP</div>
        <div className="mt-10 flex flex-col justify-between gap-2 border-t border-white/15 pt-5 text-[9px] text-white/60 sm:flex-row"><span>Project close-out / the whole fit-out lifecycle in one platform.</span><span className="mono">JCT FIT-OUTS ERP / WEB PLATFORM</span></div>
      </div>
    </footer>
  );
}
