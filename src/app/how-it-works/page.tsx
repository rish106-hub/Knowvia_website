import { EarlyAccessSection } from "@/components/marketing/EarlyAccessSection";
import { PageHeader } from "@/components/marketing/PageHeader";
import { RouteScene } from "@/components/route/RouteScene";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "How it works",
  description:
    "How Knowvia turns policy documents into what is known, what is unknown and the next action, and where people and rules, not models, make the decisions.",
  path: "/how-it-works",
});

const steps = [
  {
    title: "Documents in",
    what: "You add the policy documents you already have: schedule, wording, Customer Information Sheet, e-cards.",
    boundary: "Nothing is inferred about a policy Knowvia has not seen. A missing document is listed as missing.",
  },
  {
    title: "Facts with their source",
    what: "Each fact, such as a room-rent limit or a waiting period, is recorded with the document and page it came from.",
    boundary: "Every extracted fact is checked against its source before it is shown, and you can open the page yourself.",
  },
  {
    title: "Conflicts and gaps",
    what: "Where two documents disagree, or a family member has no cover for a likely need, Knowvia says so plainly.",
    boundary: "A conflict is never resolved by picking the friendlier number. It stays open.",
  },
  {
    title: "Unknowns stay unknown",
    what: "Some answers only the insurer can give, such as whether a specific claim will be paid.",
    boundary: "Knowvia does not approve claims or predict decisions. It names who can answer and what to ask.",
  },
  {
    title: "The next action",
    what: "Each open item becomes one action with an owner: a question to send, a detail to collect, a card to save.",
    boundary: "You decide what to do. Nothing is sent to an insurer or employer without your explicit confirmation.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        title="From documents to one next action"
        lede="Knowvia separates what your documents establish from what they leave open, then turns the open items into clear next steps."
        path="/how-it-works"
      />
      <section className="section-tight">
        <div className="wrap split">
          <ol className="process">
            {steps.map((step) => (
              <li key={step.title}>
                <div>
                  <h2 style={{ fontSize: "var(--step-1)", fontFamily: "var(--font-sans)", fontWeight: 600 }}>{step.title}</h2>
                  <p className="muted">{step.what}</p>
                </div>
                <p className="small">
                  <strong>Boundary:</strong> {step.boundary}
                </p>
              </li>
            ))}
          </ol>
          <RouteScene />
        </div>
      </section>
      <EarlyAccessSection placement="footer" />
    </>
  );
}
