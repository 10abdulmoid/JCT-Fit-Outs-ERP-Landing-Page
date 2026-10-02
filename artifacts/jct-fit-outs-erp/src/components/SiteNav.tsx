import { useEffect, useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { useAuthUrl } from '../hooks/use-auth-url';

export function SiteNav() {
  const [shown, setShown] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
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

  const close = () => setMenuOpen(false);

  return (
    <header className={`fixed inset-x-0 top-0 z-40 px-5 md:px-10 transition-transform duration-500 ${shown ? 'translate-y-0' : '-translate-y-full'}`}>
      <nav aria-label="Main navigation" className="mx-auto flex max-w-[1440px] items-center justify-between border-b border-white/15 py-5 text-white">
        <a href="#top" onClick={close} className="flex items-center gap-3" aria-label="JCT Fit-Outs ERP home">
          <span className="flex h-9 w-9 items-center justify-center border border-white/60 text-[11px] font-bold tracking-tight">JCT</span>
          <span className="text-[12px] font-semibold tracking-[.04em]">FIT-OUTS <span className="font-normal text-white/50">ERP</span></span>
        </a>
        <div className="hidden items-center gap-9 text-[11px] font-medium tracking-[.06em] md:flex">
          <a className="nav-link" href="#plan">Platform</a>
          <a className="nav-link" href="#portals">Portals</a>
          <a className="nav-link" href="#finance">Finance</a>
          <a
            href={auth.url}
            aria-disabled={auth.isDisabled}
            tabIndex={auth.isDisabled ? -1 : undefined}
            onClick={auth.isDisabled ? (e) => e.preventDefault() : undefined}
            className={`nav-link flex items-center gap-1 ${auth.isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
          >
            Sign in <ArrowUpRight size={13} />
          </a>
          <a href="#demo" className="magnetic btn-primary px-5 py-3 text-[11px] font-semibold">Book a demo</a>
        </div>
        <button type="button" className="md:hidden rounded-md border border-white/30 p-2" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}>
          {menuOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </nav>
      {menuOpen && <div className="absolute inset-x-4 top-[76px] rounded-xl border border-white/15 bg-[#10232c]/95 p-5 text-white shadow-2xl backdrop-blur-xl md:hidden">
        <div className="flex flex-col gap-5 text-sm">
          <a href="#plan" onClick={close}>Platform</a>
          <a href="#portals" onClick={close}>Portals</a>
          <a href="#finance" onClick={close}>Finance</a>
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
          <a href="#demo" onClick={close} className="btn-primary px-4 py-3 text-center">Book a demo</a>
        </div>
      </div>}
    </header>
  );
}
