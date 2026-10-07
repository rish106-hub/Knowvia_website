"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pause, Play } from "@phosphor-icons/react/ssr";
import { walkthroughVideos, type WalkthroughJourney } from "@/content/walkthrough-videos";
import { track } from "@/lib/analytics/client";

// A silent screen recording of the synthetic walkthrough, in a light and a dark cut. CSS shows the
// cut that matches the theme; only the visible one is ever played or downloaded (preload="none").
// It plays muted while on screen, has a visible pause control (WCAG 2.2.2), and never autoplays
// under reduced motion. Chapters are plain buttons, so the steps are readable without the video.
export function WalkthroughVideo({ journey }: { journey: WalkthroughJourney }) {
  const meta = walkthroughVideos[journey];
  const loopStart = meta.chapters[0].start;
  const wrapRef = useRef<HTMLDivElement>(null);
  const lightRef = useRef<HTMLVideoElement>(null);
  const darkRef = useRef<HTMLVideoElement>(null);
  const userPaused = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);

  const visibleVideo = useCallback(() => {
    const candidates = [lightRef.current, darkRef.current];
    return candidates.find((video) => video && getComputedStyle(video).display !== "none") ?? null;
  }, []);

  const play = useCallback(() => {
    const video = visibleVideo();
    [lightRef.current, darkRef.current].forEach((other) => {
      if (other && other !== video) other.pause();
    });
    if (!video) return;
    // The recording opens on a moment of empty background; loops skip it.
    if (video.currentTime < loopStart) video.currentTime = loopStart;
    void video.play().catch(() => setPlaying(false));
  }, [loopStart, visibleVideo]);

  const pause = useCallback(() => {
    [lightRef.current, darkRef.current].forEach((video) => video?.pause());
  }, []);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const motionOk = window.matchMedia("(prefers-reduced-motion: no-preference)");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && motionOk.matches && !userPaused.current) play();
        else if (!entry.isIntersecting) pause();
      },
      { threshold: 0.4 },
    );
    observer.observe(wrap);

    // Swap cuts when the theme changes while playing.
    const swap = () => {
      const current = [lightRef.current, darkRef.current].find((video) => video && !video.paused);
      if (!current) return;
      const next = visibleVideo();
      if (next && next !== current) {
        next.currentTime = current.currentTime;
        current.pause();
        void next.play().catch(() => undefined);
      }
    };
    const themeObserver = new MutationObserver(swap);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
    const scheme = window.matchMedia("(prefers-color-scheme: dark)");
    scheme.addEventListener("change", swap);

    return () => {
      observer.disconnect();
      themeObserver.disconnect();
      scheme.removeEventListener("change", swap);
    };
  }, [pause, play, visibleVideo]);

  const toggle = () => {
    if (playing) {
      userPaused.current = true;
      pause();
      track("walkthrough_video_paused", { journey });
    } else {
      userPaused.current = false;
      play();
    }
  };

  const seek = (start: number) => {
    const video = visibleVideo();
    if (!video) return;
    video.currentTime = start;
    setTime(start);
    userPaused.current = false;
    play();
  };

  const activeChapter = meta.chapters.reduce((found, chapter, index) => (time >= chapter.start ? index : found), 0);
  const handlers = {
    onPlay: () => setPlaying(true),
    onPause: () => setPlaying(visibleVideo()?.paused === false),
    onTimeUpdate: (event: React.SyntheticEvent<HTMLVideoElement>) => setTime(event.currentTarget.currentTime),
    onEnded: (event: React.SyntheticEvent<HTMLVideoElement>) => {
      event.currentTarget.currentTime = loopStart;
      void event.currentTarget.play().catch(() => undefined);
    },
  };

  return (
    <figure className="wt-video" data-journey={journey}>
      <div ref={wrapRef} className="wt-video-frame" data-playing={playing}>
        <video
          ref={lightRef}
          className="wt-cut wt-cut-light"
          src={`/walkthroughs/${journey}-light.webm`}
          poster={`/walkthroughs/${journey}-light.jpg`}
          width={960}
          height={600}
          muted
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          {...handlers}
        />
        <video
          ref={darkRef}
          className="wt-cut wt-cut-dark"
          src={`/walkthroughs/${journey}-dark.webm`}
          poster={`/walkthroughs/${journey}-dark.jpg`}
          width={960}
          height={600}
          muted
          playsInline
          preload="none"
          aria-hidden="true"
          tabIndex={-1}
          {...handlers}
        />
        <button type="button" className="wt-toggle" onClick={toggle}>
          {playing ? <Pause size={18} weight="fill" aria-hidden /> : <Play size={18} weight="fill" aria-hidden />}
          <span>{playing ? "Pause" : "Play"} walkthrough</span>
        </button>
        <span className="wt-progress" aria-hidden="true">
          <span style={{ transform: `scaleX(${Math.min(1, Math.max(0, (time - loopStart) / (meta.duration - loopStart)))})` }} />
        </span>
      </div>
      <figcaption>
        <ol className="wt-chapters" aria-label={`${meta.title} chapters`}>
          {meta.chapters.map((chapter, index) => (
            <li key={chapter.label}>
              <button
                type="button"
                className="wt-chapter"
                aria-current={playing && index === activeChapter ? "step" : undefined}
                onClick={() => seek(chapter.start)}
              >
                <span className="wt-chapter-n" aria-hidden="true">
                  {index + 1}
                </span>
                {chapter.label}
              </button>
            </li>
          ))}
        </ol>
        <p className="small muted">
          {meta.caption} <Link href={meta.tryHref}>Try it yourself</Link>
        </p>
      </figcaption>
    </figure>
  );
}
