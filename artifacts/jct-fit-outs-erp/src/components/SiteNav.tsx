import { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useAuthUrl } from '../hooks/use-auth-url';

export function SiteNav() {
  const [shown, setShown] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isLightPanel, setIsLightPanel] = useState(false);
  const auth = useAuthUrl();

  useEffect(() => {
    let previous = window.scrollY;
    const update = () => {
      const current = window.scrollY;
      if (current < 80 || current < previous - 5) setShown(true);
      else if (current > previous + 5) setShown(false);
      previous = current;
    };

    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

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

  const close = () => setMenuOpen(false);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-all duration-200 ${
        shown ? 'translate-y-0' : '-translate-y-full'
      }`}
      style={{
        backgroundColor: isLightPanel ? 'rgba(243, 245, 250, 0.8)' : 'rgba(15, 32, 39, 0.55)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: isLightPanel ? '1px solid rgba(203, 213, 225, 0.8)' : '1px solid rgba(255, 255, 255, 0.15)',
      }}
    >
      <nav
        aria-label="Main navigation"
        className={`mx-auto flex max-w-[1440px] items-center justify-between px-5 md:px-10 py-4 transition-colors duration-200 ${
          isLightPanel ? 'text-[#18181b]' : 'text-white'
        }`}
      >
        <a href="#top" onClick={close} className="flex items-center gap-3" aria-label="JCT Fit-Outs ERP home">
          <span
            className={`flex h-9 w-9 items-center justify-center border text-[11px] font-bold tracking-tight transition-colors duration-200 ${
              isLightPanel ? 'border-[#18181b]/80 text-[#18181b]' : 'border-white/60 text-white'
            }`}
          >
            JCT
          </span>
          <span className="text-[12px] font-semibold tracking-[.04em]">
            FIT-OUTS{' '}
            <span
              className={`font-normal transition-colors duration-200 ${
                isLightPanel ? 'text-[#18181b]/60' : 'text-white/50'
              }`}
            >
              ERP
            </span>
          </span>
        </a>
        <div className="hidden items-center gap-9 text-[11px] font-medium tracking-[.06em] md:flex">
          <a
            className={`nav-link transition-colors duration-200 ${
              isLightPanel ? 'hover:text-[#2a55a8]' : 'hover:text-white'
            }`}
            href="#plan"
          >
            Platform
          </a>
          <a
            className={`nav-link transition-colors duration-200 ${
              isLightPanel ? 'hover:text-[#2a55a8]' : 'hover:text-white'
            }`}
            href="#portals"
          >
            Portals
          </a>
          <a
            className={`nav-link transition-colors duration-200 ${
              isLightPanel ? 'hover:text-[#2a55a8]' : 'hover:text-white'
            }`}
            href="#finance"
          >
            Finance
          </a>
          <a
            href={auth.url}
            aria-disabled={auth.isDisabled}
            tabIndex={auth.isDisabled ? -1 : undefined}
            onClick={auth.isDisabled ? (e) => e.preventDefault() : undefined}
            className={`nav-link flex items-center gap-1 transition-colors duration-200 ${
              isLightPanel ? 'hover:text-[#2a55a8]' : 'hover:text-white'
            } ${auth.isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            Sign in <ArrowUpRight size={13} />
          </a>
          <a href="#demo" className="magnetic btn-primary px-5 py-3 text-[11px] font-semibold">
            Book a demo
          </a>
        </div>
        <button
          type="button"
          className={`md:hidden rounded-md border p-2 transition-colors duration-200 ${
            isLightPanel ? 'border-[#18181b]/30 text-[#18181b]' : 'border-white/30 text-white'
          }`}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </nav>
      {menuOpen && (
        <div
          className={`absolute inset-x-4 top-[72px] rounded-xl border p-5 shadow-2xl backdrop-blur-xl md:hidden ${
            isLightPanel
              ? 'border-[#18181b]/15 bg-[#f3f5fa]/95 text-[#18181b]'
              : 'border-white/15 bg-[#10232c]/95 text-white'
          }`}
        >
          <div className="flex flex-col gap-5 text-sm">
            <a href="#plan" onClick={close}>
              Platform
            </a>
            <a href="#portals" onClick={close}>
              Portals
            </a>
            <a href="#finance" onClick={close}>
              Finance
            </a>
            <a
              href={auth.url}
              aria-disabled={auth.isDisabled}
              tabIndex={auth.isDisabled ? -1 : undefined}
              onClick={(e) => {
                if (auth.isDisabled) e.preventDefault();
                close();
              }}
              className={auth.isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
            >
              Sign in
            </a>
            <a href="#demo" onClick={close} className="btn-primary px-4 py-3 text-center">
              Book a demo
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
