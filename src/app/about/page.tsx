import Link from "next/link";
import { PageHeader } from "@/components/marketing/PageHeader";
import { SupportStrip } from "@/components/marketing/SupportStrip";
import { researchClaim } from "@/content/evidence";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "About",
  description: "Why Knowvia exists, how the research was done, what it does not claim, and who has supported the project.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <PageHeader
        title="Why Knowvia exists"
        lede="Most families find out what their health cover means at the hospital desk. We want that moment to come earlier, and calmer."
        path="/about"
      />
      <nav className="wrap subnav" aria-label="On this page">
        <a href="#mission">Mission</a>
        <a href="#research">Research</a>
        <a href="#limits">What Knowvia does</a>
      </nav>
      <section className="section-tight">
        <div className="wrap two-col" data-reveal-stagger>
          <div className="prose">
            <h2 id="mission">Mission</h2>
            <p>
              Health cover in India is often split across an employer policy, a family floater and a parent&apos;s
              policy, each with its own limits and its own paperwork. Usually one person holds it all in their head.
              Knowvia brings those documents into 1 shared view: what the plans say, what still needs checking, and what
              to do next.
            </p>
            <h2 id="research">How we did the research</h2>
            <p>
              {researchClaim.headline}. {researchClaim.note}
            </p>
            <p>
              We publish quotes from those conversations only with each person&apos;s written approval of the exact
              wording and how their name appears. We do not use generated portraits in place of real people.
            </p>
          </div>
          <div className="prose">
            <h2 id="limits">What Knowvia does</h2>
            <ul>
              <li>Puts work, family and parents&apos; health plans in 1 view.</li>
              <li>Shows every limit with the exact page behind it.</li>
              <li>Flags mismatches and questions that still need an answer.</li>
              <li>Turns every open question into a clear next step.</li>
            </ul>
            <p>
              Read more about our boundaries on the <Link href="/trust">trust page</Link>.
            </p>
          </div>
        </div>
      </section>
      <SupportStrip />
      <div className="section-tight" />
    </>
  );
}
