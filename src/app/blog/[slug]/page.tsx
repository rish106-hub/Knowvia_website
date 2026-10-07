import Link from "next/link";
import { YouTubeFacade } from "@/components/media/YouTubeFacade";
import { articleVideos } from "@/content/videos";
import { notFound } from "next/navigation";
import { ArticleOpenedEvent } from "@/components/marketing/ArticleOpenedEvent";
import { EarlyAccessSection } from "@/components/marketing/EarlyAccessSection";
import { PageHeader } from "@/components/marketing/PageHeader";
import { articles, getArticle, type ArticleBlock } from "@/content/articles";
import { sources, type SourceId } from "@/content/sources";
import { JsonLd, pageMetadata } from "@/lib/seo";
import { absoluteUrl, siteConfig } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) return {};
  return pageMetadata({
    title: article.title,
    description: article.description,
    path: `/blog/${article.slug}`,
    type: "article",
    publishedTime: article.publishedAt,
    modifiedTime: article.updatedAt,
  });
}

const dateFormatter = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "long", year: "numeric" });

function Citations({ ids, order }: { ids?: SourceId[]; order: SourceId[] }) {
  if (!ids?.length) return null;
  return (
    <>
      {[...ids].sort((a, b) => order.indexOf(a) - order.indexOf(b)).map((id) => (
        <sup key={id} className="cite">
          <a href={`#source-${id}`} aria-label={`Source ${order.indexOf(id) + 1}: ${sources[id].title}`}>
            [{order.indexOf(id) + 1}]
          </a>
        </sup>
      ))}
    </>
  );
}

function Block({ block, order }: { block: ArticleBlock; order: SourceId[] }) {
  switch (block.type) {
    case "h2":
      return <h2>{block.text}</h2>;
    case "p":
      return (
        <p>
          {block.text}
          <Citations ids={block.cite} order={order} />
        </p>
      );
    case "ul":
      return (
        <>
          <ul>
            {block.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          {block.cite ? (
            <p className="small muted">
              Source
              <Citations ids={block.cite} order={order} />
            </p>
          ) : null}
        </>
      );
    case "ol":
      return (
        <ol>
          {block.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
      );
    case "example":
      return (
        <div className="example-box">
          <p>{block.title}</p>
          <ul>
            {block.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
        </div>
      );
    case "limit":
      return (
        <p className="notice">
          <strong>Limits of this guide</strong>
          {block.text}
        </p>
      );
  }
}

export default async function ArticlePage({ params }: PageProps<"/blog/[slug]">) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  const order = article.sourceIds;
  const url = absoluteUrl(`/blog/${article.slug}`);

  return (
    <article>
      <ArticleOpenedEvent slug={article.slug} />
      <PageHeader title={article.title} path={`/blog/${article.slug}`} crumbs={[{ name: "Guides", path: "/blog" }]}>
        <div className="byline">
          <span>By {article.author}</span>
          <span>Expert review: {article.reviewer ?? "pending"}</span>
          <span>
            Published <time dateTime={article.publishedAt}>{dateFormatter.format(new Date(article.publishedAt))}</time>
          </span>
          <span>
            Updated <time dateTime={article.updatedAt}>{dateFormatter.format(new Date(article.updatedAt))}</time>
          </span>
        </div>
      </PageHeader>
      <div className="wrap article-layout" style={{ paddingBottom: "4rem" }}>
        <div className="prose">
          <section className="answer-box" aria-labelledby="short-answer">
            <h2 id="short-answer">The short answer</h2>
            <p>{article.directAnswer}</p>
          </section>
          {article.body.map((block, index) => (
            <Block key={index} block={block} order={order} />
          ))}
          {articleVideos[article.slug] ? (
            <section className="article-video" aria-labelledby="watch-title" data-reveal>
              <h2 id="watch-title">Prefer to watch?</h2>
              <YouTubeFacade video={articleVideos[article.slug]!} placement="article" />
              <p className="small muted">
                A public explainer from another publisher, chosen for its topic. Knowvia has no relationship with the
                publisher. Where it differs from this guide or your policy wording, the wording and the cited rules apply.
              </p>
            </section>
          ) : null}
          <h2 id="sources">Sources</h2>
          <ol className="source-list">
            {order.map((id) => (
              <li key={id} id={`source-${id}`}>
                <a href={sources[id].url} rel="noopener noreferrer" target="_blank">
                  {sources[id].title}
                </a>
                . {sources[id].publisher}. Read on {dateFormatter.format(new Date(sources[id].accessed))}.
              </li>
            ))}
          </ol>
        </div>
        <aside className="article-aside" aria-label="Related">
          <div>
            <h2>Related</h2>
            <ul>
              {article.related.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <p className="notice">
            <strong>Not advice</strong>
            Knowvia explains documents and rules. It is not an insurer, broker or adviser.
          </p>
        </aside>
      </div>
      <EarlyAccessSection placement="article" />
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: article.title,
          description: article.description,
          datePublished: article.publishedAt,
          dateModified: article.updatedAt,
          mainEntityOfPage: url,
          url,
          inLanguage: "en-IN",
          author: { "@type": "Organization", name: article.author, url: siteConfig.url },
          publisher: { "@type": "Organization", name: siteConfig.name, url: siteConfig.url },
          citation: order.map((id) => ({ "@type": "CreativeWork", name: sources[id].title, url: sources[id].url })),
        }}
      />
    </article>
  );
}
