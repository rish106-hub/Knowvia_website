import Link from "next/link";
import { JsonLd, breadcrumbJsonLd } from "@/lib/seo";
import styles from "./PageHeader.module.css";

interface PageHeaderProps {
  title: string;
  lede?: string;
  path: string;
  crumbs?: { name: string; path: string }[];
  children?: React.ReactNode;
}

export function PageIntro({ title, lede, path, crumbs = [], children }: PageHeaderProps) {
  const trail = [{ name: "Home", path: "/" }, ...crumbs, { name: title, path }];
  return (
    <header className={`wrap ${styles.header}`}>
      <nav className={styles.breadcrumb} aria-label="Breadcrumb">
        <ol>
          {trail.map((item, index) => (
            <li key={item.path}>
              {index === trail.length - 1 ? <span aria-current="page">{item.name}</span> : <Link href={item.path}>{item.name}</Link>}
            </li>
          ))}
        </ol>
      </nav>
      <h1>{title}</h1>
      {lede ? <p className={styles.lede}>{lede}</p> : null}
      {children}
      <JsonLd data={breadcrumbJsonLd(trail)} />
    </header>
  );
}

export const PageHeader = PageIntro;
