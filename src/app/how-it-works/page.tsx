import { EarlyAccessSection } from "@/components/marketing/EarlyAccessSection";
import { PageHeader } from "@/components/marketing/PageHeader";
import { WalkthroughTheatre } from "@/components/home/WalkthroughTheatre";
import { VideoShelf } from "@/components/media/VideoShelf";
import { RouteScene } from "@/components/route/RouteScene";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "How it works",
  description:
    "How Knowvia brings your health cover into one view, shows what needs checking and gives every open question a next step.",
  path: "/how-it-works",
});

const steps = [
  {
    title: "Add what you have",
    what: "Add the plan papers and e-cards you already have.",
    boundary: "If something is missing, Knowvia says so. It does not fill in the blanks.",
  },
  {
    title: "See the exact page",
    what: "Every limit and waiting period links back to the page where it appears.",
    boundary: "You can open that page and check the answer yourself.",
  },
  {
    title: "Spot mismatches",
    what: "If 2 documents show different amounts, or someone is missing from a plan, Knowvia flags it.",
    boundary: "It never picks the better-looking amount. The question stays open.",
  },
  {
    title: "Keep questions open",
    what: "Some answers can only come from the insurer, such as whether a claim will be paid.",
    boundary: "Knowvia does not guess. It tells you who to ask and what to ask them.",
  },
  {
    title: "Know what to do",
    what: "Every open question gets 1 clear action: ask, collect or save.",
    boundary: "You stay in control. Nothing is sent without your confirmation.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <PageHeader
        title="Your cover, sorted."
        lede="See what your plans say, what needs checking and what to do next."
        path="/how-it-works"
      />
      <section className="section-tight">
        <div className="wrap split">
          <ol className="process" data-reveal-stagger>
            {steps.map((step) => (
              <li key={step.title}>
                <div>
                  <h2 style={{ fontSize: "var(--step-1)", fontFamily: "var(--font-sans)", fontWeight: 600 }}>{step.title}</h2>
                  <p className="muted">{step.what}</p>
                </div>
                <p className="small">
                  <strong>Why it matters:</strong> {step.boundary}
                </p>
              </li>
            ))}
          </ol>
          <RouteScene />
        </div>
      </section>
      <section className="section section-emphasis" aria-labelledby="watch-title">
        <div className="wrap">
          <div className="section-head" data-reveal>
            <p className="eyebrow">Watch it work</p>
            <h2 id="watch-title">See it for a household and HR team</h2>
          </div>
          <div data-reveal>
            <WalkthroughTheatre />
          </div>
        </div>
      </section>
      <VideoShelf
        id="insurer-title"
        title="When only the insurer can answer"
        lede="Knowvia names who can settle an open question. If an insurer does not resolve a complaint, the regulator explains where to take it next."
        videos={["bimaBharosa", "claimsAwareness"]}
      />
      <EarlyAccessSection placement="footer" />
    </>
  );
}
