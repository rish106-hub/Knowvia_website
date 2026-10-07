import Link from "next/link";
import { ArrowUpRight } from "@phosphor-icons/react/ssr";
import type { Article } from "@/content/articles";
import styles from "./GuidePreview.module.css";

const audienceLabel = { family: "Families", team: "HR teams", both: "Families and HR" } as const;

export function GuidePreview({ articles }: { articles: Article[] }) {
  return (
    <div className={styles.grid}>
      {articles.map((article, index) => (
        <Link key={article.slug} href={`/blog/${article.slug}`} className={styles.card} data-featured={index === 0 || undefined}>
          <span className={styles.audience}>{audienceLabel[article.audience]}</span>
          <h3>{article.title}</h3>
          <p>{article.description}</p>
          <span className={styles.open}>Read guide <ArrowUpRight size={18} aria-hidden /></span>
        </Link>
      ))}
    </div>
  );
}
