import Link from "next/link";
import { EarlyAccessSection } from "@/components/marketing/EarlyAccessSection";
import { PageHeader } from "@/components/marketing/PageHeader";
import { VideoShelf } from "@/components/media/VideoShelf";
import { WalkthroughVideo } from "@/components/media/WalkthroughVideo";
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
        title="3 policies. 1 hospital. No time to search."
        lede="Work cover, family cover and a parent's plan: Knowvia lines them up and shows what each one means."
        path="/for-families"
      />

      <section className="section-tight" aria-labelledby="family-video-title">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <p className="eyebrow">Watch first</p>
            <h2 id="family-video-title">1 household, 3 policies, 4 steps</h2>
          </div>
          <div data-reveal>
            <WalkthroughVideo journey="family" />
          </div>
        </div>
      </section>

      <section className="section-tight" id="try-family" aria-label="Try the family example">
        <div className="wrap split">
          <div className="stack" style={{ "--stack-space": "1.5rem" } as React.CSSProperties}>
            <ul className="plain-list" data-reveal-stagger>
              <li>
                <h3>Cover at a glance</h3>
                <p className="muted">
                  Cover amount, room limits, what you pay yourself, waiting time and smaller limits for each person.
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
              <strong>Everything in 1 view</strong>
              Your health plans, limits, open questions and next steps, ready before a hospital visit.
            </p>
          </div>
          <FamilyWalkthrough />
        </div>
      </section>

      <VideoShelf
        id="family-explainers-title"
        title="Explainers worth a few minutes"
        videos={["roomRentLimit", "cashlessVsReimbursement", "claimsAwareness"]}
      />

      <section className="section-tight">
        <div className="wrap">
          <div className="section-head" data-reveal>
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
