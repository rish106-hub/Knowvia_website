import { EarlyAccessForm } from "@/components/leads/EarlyAccessForm";

interface EarlyAccessSectionProps {
  placement?: "hero" | "article" | "footer";
  defaultAudience?: "individual" | "hr";
}

export function EarlyAccessSection({ placement = "footer", defaultAudience = "individual" }: EarlyAccessSectionProps) {
  return (
    <section id="early-access" className="section section-emphasis" aria-labelledby="early-access-title">
      <div className="wrap early-access-panel">
        <div className="stack" style={{ "--stack-space": "1.1rem" } as React.CSSProperties}>
          <h2 id="early-access-title">Be first to try Knowvia</h2>
          <p className="lede">
            We are opening Knowvia to a small group of families and HR teams first. Leave your email and we will write
            when there is a place for you.
          </p>
          <ul className="muted">
            <li>1 confirmation email, then only what you asked for.</li>
            <li>No policy documents, health details or phone number needed.</li>
            <li>Stop at any time from any email.</li>
          </ul>
        </div>
        <EarlyAccessForm placement={placement} defaultAudience={defaultAudience} />
      </div>
    </section>
  );
}
