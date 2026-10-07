import Link from "next/link";
import { EarlyAccessSection } from "@/components/marketing/EarlyAccessSection";
import { PageHeader } from "@/components/marketing/PageHeader";
import { VideoShelf } from "@/components/media/VideoShelf";
import { WalkthroughVideo } from "@/components/media/WalkthroughVideo";
import { TeamWalkthrough } from "@/features/marketing/walkthroughs";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "For employers",
  description:
    "Help employees understand their group health cover, see where enrolment is incomplete, and hand each open question to the right owner.",
  path: "/for-employers",
});

export default function ForEmployersPage() {
  return (
    <>
      <PageHeader
        title="Employees should not discover their cover during a crisis."
        lede="Employees understand the group health insurance you already pay for. HR sees what is missing and who handles it."
        path="/for-employers"
      />

      <section className="section-tight" aria-labelledby="team-video-title">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <p className="eyebrow">Watch first</p>
            <h2 id="team-video-title">What HR sees, without seeing anyone&apos;s health details</h2>
          </div>
          <div data-reveal>
            <WalkthroughVideo journey="team" />
          </div>
        </div>
      </section>

      <section className="section-tight" id="try-team" aria-label="Try the team example">
        <div className="wrap split">
          <div className="stack" style={{ "--stack-space": "1.5rem" } as React.CSSProperties}>
            <ul className="plain-list" data-reveal-stagger>
              <li>
                <h3>Employee clarity</h3>
                <p className="muted">
                  Each employee sees what the work plan covers for them and their family, with the exact page behind it.
                </p>
              </li>
              <li>
                <h3>Enrolment visibility</h3>
                <p className="muted">
                  Missing dependant details and new joiners without e-cards show up before they become a problem at a
                  hospital desk.
                </p>
              </li>
              <li>
                <h3>Onboarding and exits</h3>
                <p className="muted">
                  New joiners learn how hospital payment works on day 1. Leavers see when cover ends and how they may keep it.
                </p>
              </li>
              <li>
                <h3>Clear ownership</h3>
                <p className="muted">
                  Questions the documents cannot answer go to the broker or insurer with an owner and a date, instead of
                  sitting in an inbox.
                </p>
              </li>
            </ul>
            <p className="notice">
              <strong>Employee privacy</strong>
              HR sees counts and open tasks, not employees&apos; health details or claims. What an employee shares about
              their family stays with them.
            </p>
          </div>
          <TeamWalkthrough />
        </div>
      </section>

      <VideoShelf
        id="team-explainers-title"
        title="Explainers to share with your team"
        videos={["retainEmployerCover", "portability", "cashlessVsReimbursement"]}
      />

      <section className="section-tight">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <h2>Guides for HR teams</h2>
          </div>
          <ul className="plain-list">
            <li>
              <Link href="/blog/employer-cover-after-leaving-a-job">What happens to employer cover when you leave a job</Link>
            </li>
            <li>
              <Link href="/blog/cashless-vs-reimbursement">Cashless versus reimbursement claims</Link>
            </li>
          </ul>
        </div>
      </section>

      <EarlyAccessSection placement="footer" defaultAudience="hr" />
    </>
  );
}
