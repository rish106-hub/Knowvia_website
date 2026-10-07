"use client";

import { useState } from "react";
import { Play } from "@phosphor-icons/react/ssr";
import { explainerVideos, videoPoster, type ExplainerVideoKey } from "@/content/videos";
import { track } from "@/lib/analytics/client";

type Placement = "hero" | "guide" | "article" | "footer" | "page";

// Click-to-load player. Until the visitor presses play, the page shows a self-hosted poster and
// makes no request to YouTube. Playing loads the privacy-enhanced youtube-nocookie.com player,
// which may then set its own storage; the notice under the button says so before the click.
export function YouTubeFacade({ video: key, placement }: { video: ExplainerVideoKey; placement: Placement }) {
  const video = explainerVideos[key];
  const [playing, setPlaying] = useState(false);

  return (
    <figure className="yt">
      <div className="yt-frame">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&rel=0&modestbranding=1`}
            title={video.title}
            allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            className="yt-poster"
            onClick={() => {
              setPlaying(true);
              track("explainer_video_played", { video: key, placement });
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={videoPoster(video)} alt="" width={480} height={360} loading="lazy" decoding="async" />
            <span className="yt-play" aria-hidden="true">
              <Play size={26} weight="fill" />
            </span>
            <span className="sr-only">Play video: {video.title}, from {video.channel}, on YouTube</span>
          </button>
        )}
      </div>
      <figcaption>
        <span className="yt-kind">{video.publisherKind}</span>
        <span className="yt-title">{video.title}</span>
        <span className="yt-meta small muted">
          {video.channel}. Plays from YouTube, which may set cookies once you press play.
        </span>
      </figcaption>
    </figure>
  );
}
