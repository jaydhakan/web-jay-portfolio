"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SlideText } from "@/components/ui/SlideText";
import { useLenisInstance } from "@/components/layout/SmoothScrollProvider";
import { siteConfig } from "@/data/content";
import { cn } from "@/lib/utils";

const navLinks = [
  { label: "Work", href: "/work" },
  { label: "About", href: "/about" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
] as const;

export function Header() {
  const pathname = usePathname();
  const lenis = useLenisInstance();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Sliding active-link indicator (new_plan 5.1): a small accent dot that
  // glides under the active desktop nav link. Measure the active link's box
  // (relative to the positioned <nav>) on route change / resize / font-load,
  // then drive a transform-only CSS transition.
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [indicator, setIndicator] = useState({ x: 0, top: 0, show: false });
  useEffect(() => {
    const measure = () => {
      const idx = navLinks.findIndex(
        (l) => pathname === l.href || pathname.startsWith(`${l.href}/`),
      );
      const el = idx >= 0 ? linkRefs.current[idx] : null;
      if (!el || el.offsetParent === null) {
        setIndicator((p) => (p.show ? { ...p, show: false } : p));
        return;
      }
      setIndicator({
        x: el.offsetLeft + el.offsetWidth / 2 - 2,
        top: el.offsetTop + el.offsetHeight - 6,
        show: true,
      });
    };
    const raf = requestAnimationFrame(measure);
    window.addEventListener("resize", measure);
    // Re-measure once Syne settles (display:swap shifts label widths).
    document.fonts?.ready.then(measure).catch(() => {});
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
    };
  }, [pathname]);

  // Scroll-driven chrome (scrolled bg + smart-hide), sourced from Lenis when
  // smooth scroll is active, else native window scroll (reduced motion). Read
  // menuOpen via ref so the subscription never needs to re-bind.
  const menuOpenRef = useRef(menuOpen);
  useEffect(() => {
    menuOpenRef.current = menuOpen;
  }, [menuOpen]);
  useEffect(() => {
    let prevY = lenis?.scroll ?? window.scrollY;
    const onScroll = (y: number) => {
      setScrolled(y > 60);
      // Smart-hide: scrolling down past the hero margin hides; any upward
      // scroll shows. Suppressed while the mobile menu is open.
      setHidden(y > prevY && y > 160 && !menuOpenRef.current);
      prevY = y;
    };
    if (lenis) {
      const handler = ({ scroll }: { scroll: number }) => onScroll(scroll);
      lenis.on("scroll", handler);
      return () => lenis.off("scroll", handler);
    }
    const handler = () => onScroll(window.scrollY);
    window.addEventListener("scroll", handler, { passive: true });
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, [lenis]);

  // Close the overlay on navigation (state adjustment during render, per
  // react.dev "adjusting state when props change" — no effect needed).
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (prevPathname !== pathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  // Lock scroll behind the mobile overlay. With Lenis active, stop()/start()
  // is the canonical lock; without it (reduced motion / native), fall back to
  // an overflow lock on <html>.
  useEffect(() => {
    if (lenis) {
      if (menuOpen) lenis.stop();
      else lenis.start();
      return () => lenis.start();
    }
    document.documentElement.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [menuOpen, lenis]);
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  // Dialog focus: move focus into the overlay when it opens, hand it back to the
  // toggle when it closes, and keep Tab cycling inside while it is open.
  const toggleRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  useEffect(() => {
    if (menuOpen) {
      wasOpen.current = true;
      dialogRef.current?.querySelector<HTMLElement>("button, a")?.focus();
      const onTab = (e: KeyboardEvent) => {
        if (e.key !== "Tab" || !dialogRef.current) return;
        const items = dialogRef.current.querySelectorAll<HTMLElement>("button, a");
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      };
      window.addEventListener("keydown", onTab);
      return () => window.removeEventListener("keydown", onTab);
    }
    if (wasOpen.current) {
      wasOpen.current = false;
      toggleRef.current?.focus({ preventScroll: true });
    }
  }, [menuOpen]);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  return (
    <>
      <header
        className={cn(
          // Chrome rides the critically damped spring both ways (hide and reveal
          // are the same path, mirrored). The material materializes — blur,
          // tint and hairline ease in together — instead of switching on.
          "fixed inset-x-0 top-0 z-40 transition-[translate,background-color,box-shadow,backdrop-filter] duration-[520ms] ease-spring motion-reduce:transition-[background-color,box-shadow]",
          scrolled || menuOpen ? "material-chrome" : "bg-transparent",
          hidden && "-translate-y-full",
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <Link
            href="/"
            className="group flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base rounded-full"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-accent-solid text-xs font-bold text-white">
              JD
            </span>
            <span className="text-sm font-semibold text-ink-dim transition-colors duration-200 group-hover:text-ink">
              Jay Dhakan
            </span>
          </Link>

          <nav aria-label="Primary" className="relative hidden items-center gap-1 md:flex">
            {navLinks.map((link, i) => (
              <Link
                key={link.href}
                ref={(el) => {
                  linkRefs.current[i] = el;
                }}
                href={link.href}
                aria-current={isActive(link.href) ? "page" : undefined}
                className={cn(
                  "group inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-[color,background-color] duration-200 active:bg-white/[0.08] active:duration-75",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base",
                  isActive(link.href)
                    ? "text-accent"
                    : "text-ink-dim hover:bg-white/[0.04] hover:text-ink",
                )}
              >
                <SlideText>{link.label}</SlideText>
              </Link>
            ))}
            <div className="ml-3 flex items-center gap-2">
              <Button href="/contact" size="sm">
                Let&apos;s Talk
              </Button>
            </div>
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 size-1 rounded-full bg-accent shadow-[0_0_8px_var(--color-accent)] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none"
              style={{
                top: indicator.top,
                transform: `translateX(${indicator.x}px)`,
                opacity: indicator.show ? 1 : 0,
              }}
            />
          </nav>

          <div className="flex items-center gap-2 md:hidden">
            <button
              ref={toggleRef}
              type="button"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
              className="inline-flex size-11 -mr-1.5 items-center justify-center rounded-full text-ink transition-[color,background-color,scale] duration-[520ms] ease-spring hover:bg-elevated active:scale-90 active:duration-100 active:ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base"
            >
              {menuOpen ? <X aria-hidden className="size-5" /> : <Menu aria-hidden className="size-5" />}
            </button>
          </div>
        </div>
      </header>

      {menuOpen && (
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="material-sheet anim-fade fixed inset-0 z-50 flex flex-col bg-base/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex h-16 items-center justify-end px-6">
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
                className="inline-flex size-11 -mr-1.5 items-center justify-center rounded-full text-ink transition-[color,background-color,scale] duration-[520ms] ease-spring hover:bg-elevated active:scale-90 active:duration-100 active:ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base"
              >
                <X aria-hidden className="size-5" />
              </button>
            </div>
            <nav aria-label="Mobile" className="flex flex-1 flex-col justify-center gap-2 px-8 pb-24">
              {navLinks.map((link, i) => (
                <div
                  key={link.href}
                  className="anim-rise"
                  style={{ animationDelay: `${0.05 + i * 0.06}s` }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    aria-current={isActive(link.href) ? "page" : undefined}
                    className={cn(
                      "block py-3 font-display text-4xl font-semibold tracking-[-0.02em] transition-[color,opacity] duration-200 active:opacity-60 active:duration-75",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base rounded-lg",
                      isActive(link.href) ? "text-accent" : "text-ink hover:text-accent",
                    )}
                  >
                    {link.label}
                  </Link>
                </div>
              ))}
              <div
                className="anim-rise mt-6"
                style={{ animationDelay: `${0.05 + navLinks.length * 0.06}s` }}
              >
                <Button href="/contact" size="lg" withArrow>
                  Let&apos;s Talk
                </Button>
              </div>
              <div
                className="anim-rise mt-10 border-t border-line pt-6"
                style={{ animationDelay: `${0.05 + (navLinks.length + 1) * 0.06}s` }}
              >
                {siteConfig.isAvailable && (
                  <p className="flex items-center gap-2 text-sm font-medium text-ok">
                    <span aria-hidden className="size-2 animate-pulse-dot rounded-full bg-ok" />
                    {siteConfig.availabilityNote}
                  </p>
                )}
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="mt-2 inline-flex py-2 font-mono text-sm text-ink-dim transition-colors duration-200 hover:text-ink active:opacity-60"
                >
                  {siteConfig.email}
                </a>
              </div>
            </nav>
          </div>
        )}
    </>
  );
}
