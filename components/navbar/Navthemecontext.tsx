"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";

type Theme = "light" | "dark";

type Ctx = {
  theme: Theme;
  atTop: boolean;
  navRef: React.RefObject<HTMLDivElement>;
};

const NavThemeContext = createContext<Ctx | null>(null);

export function useNavTheme() {
  const ctx = useContext(NavThemeContext);
  if (!ctx) {
    throw new Error("useNavTheme must be used within a NavThemeProvider");
  }
  return ctx;
}

export function NavThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [atTop, setAtTop] = useState(true);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setAtTop(window.scrollY <= 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let raf = 0;

    const setup = () => {
      // Use the real <nav> element so we include the top welcome bar too.
      const navEl =
        (navRef.current?.closest("nav") as HTMLElement | null) ??
        document.querySelector<HTMLElement>(
          "nav[aria-label='Main navigation']",
        ) ??
        navRef.current;

      const navHeight = navEl?.getBoundingClientRect().height ?? 64;
      const lineFromTop = Math.round(navHeight) + 1;

      // Only observe the OUTERMOST element per "stack" to avoid double-fire.
      const all = Array.from(
        document.querySelectorAll<HTMLElement>("[data-nav-theme]"),
      );
      const sections = all.filter(
        (el) => !el.parentElement?.closest("[data-nav-theme]"),
      );

      observer?.disconnect();
      observer = new IntersectionObserver(
        (entries) => {
          // Pick the entry whose top edge is closest to (but not past) the line.
          const winners = entries.filter((e) => e.isIntersecting);
          if (!winners.length) return;

          // Prefer the entry with the greatest top that's still <= lineFromTop.
          const chosen = winners.reduce((best, cur) => {
            if (!best) return cur;
            return cur.boundingClientRect.top > best.boundingClientRect.top
              ? cur
              : best;
          });

          const t = chosen.target.getAttribute(
            "data-nav-theme",
          ) as Theme | null;
          if (t === "light" || t === "dark") {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => setTheme(t));
          }
        },
        {
          rootMargin: `-${lineFromTop}px 0px -${Math.max(
            window.innerHeight - lineFromTop - 1,
            0,
          )}px 0px`,
          threshold: 0,
        },
      );

      sections.forEach((el) => observer!.observe(el));
    };

    setup();

    // Re-setup when sections change (e.g. route transitions, async content)
    const mo = new MutationObserver(() => setup());
    mo.observe(document.body, { childList: true, subtree: true });

    window.addEventListener("resize", setup);

    return () => {
      cancelAnimationFrame(raf);
      mo.disconnect();
      window.removeEventListener("resize", setup);
      observer?.disconnect();
    };
  }, []);

  return (
    <NavThemeContext.Provider value={{ theme, atTop, navRef }}>
      {children}
    </NavThemeContext.Provider>
  );
}
