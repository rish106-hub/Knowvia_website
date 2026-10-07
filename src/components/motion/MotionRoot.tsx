"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// One observer for the whole site. Server components opt in with attributes:
//   data-reveal           the element rises in when it scrolls into view
//   data-reveal-stagger   each direct child rises in, one after another
//   data-count-to="50"    the number counts up the first time it is seen
//   data-inview           gets the class "is-inview" the first time it is seen (CSS scenes)
// Content is visible by default. Only elements still below the fold when the page loads are
// hidden for their entrance, so nothing disappears without JavaScript or under reduced motion.
export function MotionRoot() {
  const pathname = usePathname();

  useEffect(() => {
    const scenes = Array.from(document.querySelectorAll<HTMLElement>("[data-inview]"));
    const settle = () => scenes.forEach((node) => node.classList.add("is-inview"));
    if (!window.matchMedia("(prefers-reduced-motion: no-preference)").matches || !("IntersectionObserver" in window)) {
      settle();
      return;
    }

    // CSS scenes only take their "before" pose once this is set, so without JavaScript they rest
    // in their finished state.
    document.documentElement.dataset.motion = "on";

    const sceneObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-inview");
          sceneObserver.unobserve(entry.target);
        }
      },
      { threshold: 0.35 },
    );
    scenes.forEach((node) => sceneObserver.observe(node));

    const targets: HTMLElement[] = [];
    document.querySelectorAll<HTMLElement>("[data-reveal]").forEach((node) => targets.push(node));
    document.querySelectorAll<HTMLElement>("[data-reveal-stagger]").forEach((parent) => {
      Array.from(parent.children).forEach((child, index) => {
        if (child instanceof HTMLElement) {
          child.style.setProperty("--reveal-i", String(index));
          targets.push(child);
        }
      });
    });

    const fold = window.innerHeight;
    const pending = targets.filter((node) => !node.classList.contains("reveal") && node.getBoundingClientRect().top > fold);
    pending.forEach((node) => node.classList.add("reveal", "reveal-pending"));

    const revealer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.remove("reveal-pending");
          revealer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    pending.forEach((node) => revealer.observe(node));

    const frames = new Set<number>();
    const counter = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        counter.unobserve(entry.target);
        const node = entry.target as HTMLElement;
        const target = Number(node.dataset.countTo);
        if (!Number.isFinite(target)) continue;
        const suffix = node.dataset.countSuffix ?? "";
        const start = performance.now();
        const duration = 1400;
        const step = (now: number) => {
          const t = Math.min(1, (now - start) / duration);
          const eased = 1 - Math.pow(1 - t, 3);
          node.textContent = `${Math.round(target * eased)}${suffix}`;
          if (t < 1) frames.add(requestAnimationFrame(step));
        };
        frames.add(requestAnimationFrame(step));
      }
    });
    document.querySelectorAll<HTMLElement>("[data-count-to]").forEach((node) => counter.observe(node));

    return () => {
      sceneObserver.disconnect();
      revealer.disconnect();
      counter.disconnect();
      frames.forEach((frame) => cancelAnimationFrame(frame));
      // Reset rather than finish, so a remount (Strict Mode, or a layout that survives navigation)
      // observes from scratch. Nothing is left hidden in between.
      pending.forEach((node) => node.classList.remove("reveal", "reveal-pending"));
      scenes.forEach((node) => node.classList.remove("is-inview"));
      document.querySelectorAll<HTMLElement>("[data-count-to]").forEach((node) => {
        node.textContent = `${node.dataset.countTo}${node.dataset.countSuffix ?? ""}`;
      });
    };
  }, [pathname]);

  return null;
}
