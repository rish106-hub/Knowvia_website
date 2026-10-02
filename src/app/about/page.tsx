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
      <section className="section-tight">
        <div className="wrap two-col">
          <div className="prose">
            <h2>Mission</h2>
            <p>
              Health cover in India is often split across an employer policy, a family floater and a parent&apos;s
              policy, each with its own limits and its own paperwork. Usually one person holds it all in their head.
              Knowvia turns those documents into a shared, sourced picture: what is known, what is unknown, and the next
              action.
            </p>
            <h2>How we did the research</h2>
            <p>
              {researchClaim.headline}. {researchClaim.provenance}
            </p>
            <p>
              We publish quotes from those conversations only with each person&apos;s written approval of the exact
              wording and how their name appears. We do not use generated portraits in place of real people.
            </p>
          </div>
          <div className="prose">
            <h2>What we do not claim</h2>
            <ul>
              <li>We do not predict or approve claims.</li>
              <li>We do not sell, recommend or compare insurance products today.</li>
              <li>
                The examples on this site are invented. They show how Knowvia works, not results for real customers.
              </li>
              <li>Knowvia is early. Features described here are being built and tested with a small group.</li>
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
