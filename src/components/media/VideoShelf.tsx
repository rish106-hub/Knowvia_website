import type { ExplainerVideoKey } from "@/content/videos";
import { YouTubeFacade } from "./YouTubeFacade";

interface VideoShelfProps {
  id: string;
  title: string;
  lede?: string;
  videos: ExplainerVideoKey[];
  placement?: "hero" | "guide" | "article" | "footer" | "page";
}

// A row of third-party explainers. The disclaimer is part of the section, not small print.
export function VideoShelf({ id, title, lede, videos, placement = "page" }: VideoShelfProps) {
  return (
    <section className="section-tight video-shelf" aria-labelledby={id}>
      <div className="wrap">
        <div className="section-head" data-reveal>
          <h2 id={id}>{title}</h2>
          {lede ? <p>{lede}</p> : null}
        </div>
        <ul className="video-grid" data-reveal-stagger>
          {videos.map((key) => (
            <li key={key}>
              <YouTubeFacade video={key} placement={placement} />
            </li>
          ))}
        </ul>
        <p className="small muted video-disclaimer">
          Public videos from other publishers, chosen because they explain the topic. Knowvia has no relationship with
          these publishers. Your own plan documents decide what applies to you.
        </p>
      </div>
    </section>
  );
}
