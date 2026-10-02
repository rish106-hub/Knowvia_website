import Link from "next/link";
import { EarlyAccessSection } from "@/components/marketing/EarlyAccessSection";
import { PageHeader } from "@/components/marketing/PageHeader";
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
        title="Group cover your people actually understand"
        lede="Employees get clear answers about the policy you already pay for. HR sees what is incomplete and who owns each next step."
        path="/for-employers"
      />

      <section className="section-tight">
        <div className="wrap split">
          <div className="stack" style={{ "--stack-space": "1.5rem" } as React.CSSProperties}>
            <ul className="plain-list">
              <li>
                <h3>Employee clarity</h3>
                <p className="muted">
                  Each employee sees what the group policy covers for them and their dependants, in plain language, with
                  the clause it comes from.
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
                  New joiners learn how cashless works on day one. Leavers learn when cover ends and what migration or
                  portability could mean for them.
                </p>
              </li>
              <li>
                <h3>Actionable handoffs</h3>
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

      <section className="section-tight">
        <div className="wrap">
          <div className="section-head">
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
