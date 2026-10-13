"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { usePathname } from "@/i18n/navigation";

export function MobileMenu({ label, children }: { label: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const [openedPath, setOpenedPath] = useState(pathname);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const visible = open && openedPath === pathname;

  useEffect(() => {
    if (!visible) return;
    const close = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const breakpoint = window.matchMedia("(min-width: 768px)");
    const resize = () => { if (breakpoint.matches) setOpen(false); };
    document.addEventListener("keydown", close);
    breakpoint.addEventListener("change", resize);
    return () => {
      document.removeEventListener("keydown", close);
      breakpoint.removeEventListener("change", resize);
    };
  }, [visible]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-expanded={visible}
        aria-controls="mobile-navigation"
        onClick={() => { setOpenedPath(pathname); setOpen(!visible); }}
        className="absolute end-4 top-3 flex h-10 w-10 items-center justify-center rounded-lg text-brand-navy hover:bg-brand-cream-deep focus-visible:outline-2 focus-visible:outline-brand-navy md:hidden"
      >
        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d={visible ? "M6 6l12 12M18 6L6 18" : "M3 6h18M3 12h18M3 18h18"} strokeLinecap="round" />
        </svg>
      </button>
      {visible ? (
        <nav
          id="mobile-navigation"
          aria-label={label}
          onClick={(event) => {
            if (event.target instanceof Element && event.target.closest("a")) setOpen(false);
          }}
          className="absolute inset-x-0 top-full flex max-h-[min(60dvh,28rem)] flex-col gap-1 overflow-y-auto overscroll-contain border-y border-brand-navy/10 bg-background px-4 py-3 shadow-lg md:hidden"
        >
          {children}
        </nav>
      ) : null}
    </>
  );
}
