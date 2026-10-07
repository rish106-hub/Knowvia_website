import Link from "next/link";
import { GuidePreview } from "@/components/marketing/GuidePreview";
import { PageHeader } from "@/components/marketing/PageHeader";
import { articles } from "@/content/articles";
import { pageMetadata } from "@/lib/seo";
import styles from "./BlogPage.module.css";

export const metadata = pageMetadata({
  title: "Guides",
  description: "Short, sourced guides to Indian health insurance: room-rent limits, cashless claims, job changes, top-ups and family access.",
  path: "/blog",
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" });
const categories = [
  { title: "For families", filter: (audience: string) => audience === "family" || audience === "both" },
  { title: "For HR teams", filter: (audience: string) => audience === "team" || audience === "both" },
] as const;

export default function BlogIndexPage() {
  return (
    <>
      <PageHeader
        title="Guides for decisions that cannot wait"
        lede="Plain answers to the policy questions that matter most at the hospital desk. Every guide shows its sources and limits."
        path="/blog"
      />
      <section className={styles.featured} aria-label="Featured guides">
        <div className="wrap"><GuidePreview articles={articles.slice(0, 3)} /></div>
      </section>
      <section className="section-tight" aria-label="Guides by audience">
        <div className={`wrap ${styles.categories}`}>
          {categories.map((category) => (
            <section key={category.title} className={styles.category}>
              <h2>{category.title}</h2>
              <ul className={styles.list}>
                {articles.filter((article) => category.filter(article.audience)).map((article) => (
                  <li key={article.slug}>
                    <Link href={`/blog/${article.slug}`}>
                      <h3>{article.title}</h3>
                      <p>{article.description}</p>
                      <span className={styles.meta}>Updated <time dateTime={article.updatedAt}>{dateFormatter.format(new Date(article.updatedAt))}</time></span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </section>
    </>
  );
}
