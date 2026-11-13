// Hand-written. Shared motion for the Sunbeam landing: reveals, highlighter sweeps and scroll-linked variables.
"use client";

import { useEffect } from "react";

/**
 * - `.sb-rv`, `.sb-mask` get `.in` and `.mk` gets `.on` the first time they enter the viewport.
 * - `[data-sb-progress]` gets `--p` (0 when its top meets the viewport bottom, 1 when its top reaches the viewport top).
 * - `[data-sb-kinetic]` gets `--sx` in px from its scroll position (speed in the attribute, default -0.6).
 * - `[data-sb-speed]` gets `--py` in px (parallax drift).
 * Everything is static when the visitor prefers reduced motion. New nodes are picked up through a MutationObserver.
 */
export function useSunbeamMotion(root: React.RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const seen = new WeakSet<Element>();
    const io = reduce || !("IntersectionObserver" in window)
      ? null
      : new IntersectionObserver((entries) => {
          for (const e of entries) {
            if (!e.isIntersecting) continue;
            // A closed .sb-mask is clipped to zero height, so its ratio stays 0: reveal it as soon as it intersects.
            if (e.intersectionRatio < 0.12 && !e.target.classList.contains("sb-mask")) continue;
            e.target.classList.add(e.target.classList.contains("mk") ? "on" : "in");
            io?.unobserve(e.target);
          }
        }, { rootMargin: "0px 0px -12% 0px", threshold: [0, 0.12] });
    const scan = () => {
      el.querySelectorAll(".sb-rv, .sb-mask, .mk").forEach((n) => {
        if (seen.has(n)) return;
        seen.add(n);
        if (io) io.observe(n);
        else n.classList.add(n.classList.contains("mk") ? "on" : "in");
      });
    };
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(el, { childList: true, subtree: true });

    let raf = 0;
    const tick = () => {
      raf = 0;
      const vh = window.innerHeight;
      el.querySelectorAll<HTMLElement>("[data-sb-progress]").forEach((n) => {
        const r = n.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (vh - r.top) / vh));
        n.style.setProperty("--p", p.toFixed(3));
      });
      el.querySelectorAll<HTMLElement>("[data-sb-kinetic]").forEach((n) => {
        const r = n.getBoundingClientRect();
        const speed = Number(n.dataset.sbKinetic || -0.6);
        n.style.setProperty("--sx", `${((r.top - vh) * speed).toFixed(1)}px`);
      });
      el.querySelectorAll<HTMLElement>("[data-sb-speed]").forEach((n) => {
        const r = n.getBoundingClientRect();
        const speed = Number(n.dataset.sbSpeed || 0.1);
        n.style.setProperty("--py", `${((r.top + r.height / 2 - vh / 2) * -speed).toFixed(1)}px`);
      });
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(tick); };
    if (!reduce) {
      tick();
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
    }
    return () => {
      io?.disconnect();
      mo.disconnect();
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [root]);
}
