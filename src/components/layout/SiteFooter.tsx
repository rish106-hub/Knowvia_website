import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="footer-grid">
        <div><strong>Knowvia</strong><p>Know your cover. Before you need it.<br />Health insurance only.</p></div>
        <nav aria-label="Knowvia"><strong>Knowvia</strong><Link href="/#how">How it works</Link><Link href="/#privacy">Privacy</Link><Link href="/#partners">For partners</Link><Link href="/#questions">Questions</Link></nav>
        <div id="contact"><strong>Contact</strong><a href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></div>
        <nav aria-label="Legal"><strong>Legal</strong><Link href="/privacy">Privacy notice</Link><Link href="/terms">Terms</Link><Link href="#top">Back to top</Link></nav>
      </div>
      <p className="footer-notice">Knowvia is not an insurer, broker, or TPA, and does not decide claims. Examples show how the product explains policy documents. © 2026 Knowvia</p>
      <div className="footer-wordmark" aria-hidden="true">Knowvia</div>
    </footer>
  );
}
