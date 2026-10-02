import Link from "next/link";
import { PageHeader } from "@/components/marketing/PageHeader";
import { articles } from "@/content/articles";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Guides",
  description: "Short, sourced guides to Indian health insurance: room-rent limits, cashless claims, job changes, top-ups and family access.",
  path: "/blog",
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" });
const audienceLabel = { family: "For families", team: "For HR teams", both: "For families and HR teams" } as const;

export default function BlogIndexPage() {
  return (
    <>
      <PageHeader
        title="Guides"
        lede="Plain answers to the policy questions that matter most at the hospital desk. Each guide links to the regulation or document it relies on."
        path="/blog"
      />
      <section className="section-tight">
        <div className="wrap">
          <ul className="article-list">
            {articles.map((article) => (
              <li key={article.slug}>
                <Link href={`/blog/${article.slug}`}>
                  <h2 style={{ fontFamily: "var(--font-sans)", fontSize: "var(--step-1)", fontWeight: 600 }}>{article.title}</h2>
                  <p>{article.description}</p>
                  <span className="article-meta">
                    {audienceLabel[article.audience]}
                    <br />
                    Updated <time dateTime={article.updatedAt}>{dateFormatter.format(new Date(article.updatedAt))}</time>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
