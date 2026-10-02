import Link from "next/link";
import { EarlyAccessSection } from "@/components/marketing/EarlyAccessSection";
import { PageHeader } from "@/components/marketing/PageHeader";
import { FamilyWalkthrough } from "@/features/marketing/walkthroughs";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "For families",
  description:
    "Line up every policy in your household, see what each one covers and what is still unclear, and agree who acts if someone is admitted.",
  path: "/for-families",
});

export default function ForFamiliesPage() {
  return (
    <>
      <PageHeader
        title="Your household's cover, in one place"
        lede="Employer cover, a family floater, a parent's policy: Knowvia lines them up, shows what each one says, and keeps what is unclear in plain view."
        path="/for-families"
      />

      <section className="section-tight">
        <div className="wrap split">
          <div className="stack" style={{ "--stack-space": "1.5rem" } as React.CSSProperties}>
            <ul className="plain-list">
              <li>
                <h3>Policy clarity</h3>
                <p className="muted">
                  Sum insured, room-rent limits, co-payments, waiting periods and sub-limits for each person, each with the
                  page it came from.
                </p>
              </li>
              <li>
                <h3>Household access</h3>
                <p className="muted">
                  Decide who can see which policy and who acts during an admission. Everyone agrees, and anyone can change
                  their mind.
                </p>
              </li>
              <li>
                <h3>Planned care</h3>
                <p className="muted">
                  Before a planned surgery, see which policy to use first, what the room choice could cost and which
                  questions to ask the insurer.
                </p>
              </li>
              <li>
                <h3>Emergency preparation</h3>
                <p className="muted">
                  E-cards, helplines and the cashless steps saved where the backup person can find them at 2 a.m.
                </p>
              </li>
            </ul>
            <p className="notice">
              <strong>What Knowvia does not do</strong>
              It does not sell insurance, approve claims or tell you what an insurer will pay. It shows what your documents
              say and what they leave open.
            </p>
          </div>
          <FamilyWalkthrough />
        </div>
      </section>

      <section className="section-tight">
        <div className="wrap">
          <div className="section-head">
            <h2>Guides for families</h2>
          </div>
          <ul className="plain-list">
            <li>
              <Link href="/blog/room-rent-limit">What a room-rent limit changes</Link>
            </li>
            <li>
              <Link href="/blog/family-policy-access">Who should be allowed to access a family policy</Link>
            </li>
            <li>
              <Link href="/blog/planned-hospital-admission">What to prepare before a planned hospital admission</Link>
            </li>
          </ul>
        </div>
      </section>

      <EarlyAccessSection placement="footer" defaultAudience="individual" />
    </>
  );
}
