import Link from "next/link";
import { CookieSettingsButton } from "@/components/consent/ConsentProvider";
import { footerNav, primaryNav, siteConfig } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="wrap">
        <div className="footer-grid">
          <div className="stack" style={{ "--stack-space": "0.75rem" } as React.CSSProperties}>
            <p className="footer-heading">Knowvia</p>
            <p>
              Knowvia brings your health insurance plans, limits and open questions into 1 clear view, so you know what
              to check before you need to claim.
            </p>
          </div>
          <div>
            <p className="footer-heading">Explore</p>
            <ul>
              {primaryNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="footer-heading">Policies</p>
            <ul>
              {footerNav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>{item.label}</Link>
                </li>
              ))}
              <li>
                <CookieSettingsButton />
              </li>
            </ul>
          </div>
        </div>
        <div className="footer-base">
          <p>
            © {new Date().getFullYear()} {siteConfig.operatorName ?? "Knowvia"}. {siteConfig.tagline}
          </p>
          {siteConfig.privacyEmail ? (
            <p>
              Privacy questions: <a href={`mailto:${siteConfig.privacyEmail}`}>{siteConfig.privacyEmail}</a>
            </p>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
