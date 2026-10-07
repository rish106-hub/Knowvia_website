import Link from "next/link";
import { ComparisonTable } from "@/components/home/ComparisonTable";
import { OldWayScene } from "@/components/home/OldWayScene";
import { WalkthroughTheatre } from "@/components/home/WalkthroughTheatre";
import { SectionShell } from "@/components/layout/SectionShell";
import { AudiencePanel } from "@/components/marketing/AudiencePanel";
import { EarlyAccessSection } from "@/components/marketing/EarlyAccessSection";
import { GuidePreview } from "@/components/marketing/GuidePreview";
import { HeroActions } from "@/components/marketing/HeroActions";
import { MediaStage } from "@/components/marketing/MediaStage";
import { PolicyClarityDemo } from "@/components/marketing/PolicyClarityDemo";
import { SupportStrip } from "@/components/marketing/SupportStrip";
import { articles } from "@/content/articles";
import { approvedQuotes, researchClaim } from "@/content/evidence";
import { pageMetadata } from "@/lib/seo";
import { siteConfig } from "@/lib/site";
import styles from "./HomePage.module.css";

export const metadata = pageMetadata({
  title: `${siteConfig.name}: ${siteConfig.tagline}`,
  description: siteConfig.description,
  path: "/",
});

export default function HomePage() {
  const quote = approvedQuotes[0];

  return (
    <>
      <section className={styles.hero}>
        <div className={`wrap ${styles.heroGrid}`}>
          <div className={styles.heroCopy}>
            <h1>Your insurer knows. Do you?</h1>
            <p>Bring every health plan, limit and gap into 1 clear view.</p>
            <HeroActions />
          </div>
          <PolicyClarityDemo />
        </div>
      </section>

      <SupportStrip />

      <OldWayScene />

      <SectionShell id="walkthrough" labelledBy="walkthrough-title" className={styles.walkthrough}>
        <div className={styles.sectionHead} data-reveal>
          <h2 id="walkthrough-title">3 health plans. 1 family view.</h2>
          <p>Cover, limits, gaps and next steps in 1 screen.</p>
        </div>
        <MediaStage><WalkthroughTheatre /></MediaStage>
      </SectionShell>

      <ComparisonTable />

      <SectionShell labelledBy="audience-title">
        <div className={styles.sectionHead} data-reveal>
          <h2 id="audience-title">Start with the people who will need the answer.</h2>
        </div>
        <AudiencePanel />
      </SectionShell>

      <SectionShell labelledBy="research-title">
        <div className={styles.research}>
          <h2 id="research-title">{researchClaim.headline}</h2>
          <div className={styles.researchNote}>
            {quote ? (
              <blockquote>
                <p>“{quote.quote}”</p>
                <footer>{quote.displayName}, {quote.context}</footer>
              </blockquote>
            ) : null}
            <p>{researchClaim.note}</p>
            <Link href="/about">Read the research approach</Link>
          </div>
        </div>
      </SectionShell>

      <SectionShell labelledBy="guides-title">
        <div className={styles.sectionHead} data-reveal>
          <h2 id="guides-title">3 guides for the questions that cannot wait.</h2>
          <p>Short, practical answers with links to the rules.</p>
        </div>
        <GuidePreview articles={articles.slice(0, 3)} />
        <Link href="/blog" className={styles.allGuides}>All guides</Link>
      </SectionShell>

      <EarlyAccessSection placement="hero" />
    </>
  );
}
