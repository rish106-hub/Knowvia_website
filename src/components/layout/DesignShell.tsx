import { designRoot } from "@/components/home/LandingPage";
import { SiteFooter } from "./SiteFooter";
import { SiteNav } from "./SiteNav";

/** Design navigation and footer around pages that are not part of the canvas (legal, partners, 404). */
export function DesignShell({ children }: { children: React.ReactNode }) {
  return (
    <div style={designRoot}>
      <a className="kv-skip" href="#main">Skip to main content</a>
      <SiteNav />
      <div id="main" className="legacy">{children}</div>
      <SiteFooter />
    </div>
  );
}
