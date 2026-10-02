import Link from "next/link";
import { EarlyAccessSection } from "@/components/marketing/EarlyAccessSection";
import { HeroActions } from "@/components/marketing/HeroActions";
import { SupportStrip } from "@/components/marketing/SupportStrip";
import { RouteScene } from "@/components/route/RouteScene";
import { articles } from "@/content/articles";
import { approvedQuotes, researchClaim } from "@/content/evidence";
import { FamilyWalkthrough, TeamWalkthrough } from "@/features/marketing/walkthroughs";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";

export const metadata = pageMetadata({
  title: `${siteConfig.name}: ${siteConfig.tagline}`,
  description: siteConfig.description,
  path: "/",
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" });

export default function HomePage() {
  return (
    <>
      <section className="hero">
        <div className="wrap hero-grid">
          <div className="hero-copy">
            <h1>Know your cover. Before you need it.</h1>
            <p className="lede">
              See what your policies cover, what remains unclear, and the next action for your family or team.
            </p>
            <HeroActions />
          </div>
          <RouteScene />
        </div>
      </section>

      <SupportStrip />

      <section className="section" aria-labelledby="model-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="model-title">Every answer comes with its evidence, or an honest unknown</h2>
            <p>
              Knowvia reads the documents you already have and sorts each fact into one of three places. Nothing is
              rounded up into reassurance.
            </p>
          </div>
          <div className="model-columns">
            <div>
              <h3>
                <span className="status-dot status-known" aria-hidden="true" />
                Known
              </h3>
              <p className="muted">
                What a document states, with the page it came from. A room-rent limit, a co-payment, who is covered.
              </p>
            </div>
            <div>
              <h3>
                <span className="status-dot status-unknown" aria-hidden="true" />
                Unknown
              </h3>
              <p className="muted">
                What the papers do not settle, such as two documents stating different limits. It stays open until the
                insurer confirms it.
              </p>
            </div>
            <div>
              <h3>
                <span className="status-dot status-next" aria-hidden="true" />
                Next
              </h3>
              <p className="muted">
                One action with an owner: a question to send, a detail to collect, a card to save before an admission.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-emphasis" aria-labelledby="walkthrough-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="walkthrough-title">Try it on an example household and team</h2>
            <p>
              Both examples use invented people and policies. Use the tabs, or the arrow keys, to move through each one.
            </p>
          </div>
          <div className="two-col">
            <FamilyWalkthrough />
            <TeamWalkthrough />
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="voices-title">
        <div className="wrap voices">
          <div className="stack">
            <h2 id="voices-title" className="voices-number">
              {researchClaim.headline}
            </h2>
            <p className="muted small">{researchClaim.provenance}</p>
            {approvedQuotes.length > 0 ? (
              <ul className="design-responses">
                {approvedQuotes.map((quote) => (
                  <li key={quote.quote}>
                    <blockquote>
                      <p>“{quote.quote}”</p>
                      <footer className="small muted">
                        {quote.displayName}, {quote.context}
                      </footer>
                    </blockquote>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <div className="stack">
            <h3>What those conversations changed</h3>
            <ul className="design-responses">
              <li>
                <strong>No guessing.</strong> When documents disagree or say nothing, Knowvia says so and names who can
                answer.
              </li>
              <li>
                <strong>A named backup.</strong> The person who would act in an emergency is often not the policyholder,
                so access is planned, agreed and recorded.
              </li>
              <li>
                <strong>Existing cover first.</strong> Employer, family and parents&apos; policies are lined up before
                anyone talks about buying more.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="section-tight" aria-labelledby="guides-title">
        <div className="wrap">
          <div className="section-head">
            <h2 id="guides-title">Plain answers, with sources</h2>
            <p>Short guides to the parts of a policy that matter most at the hospital desk.</p>
          </div>
          <ul className="article-list">
            {articles.slice(0, 4).map((article) => (
              <li key={article.slug}>
                <Link href={`/blog/${article.slug}`}>
                  <h3>{article.title}</h3>
                  <p>{article.description}</p>
                  <span className="article-meta">
                    Updated <time dateTime={article.updatedAt}>{dateFormatter.format(new Date(article.updatedAt))}</time>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p style={{ marginTop: "1.5rem" }}>
            <Link href="/blog">All guides</Link>
          </p>
        </div>
      </section>

      <EarlyAccessSection placement="hero" />
    </>
  );
}
