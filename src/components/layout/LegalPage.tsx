import { DesignShell } from "./DesignShell";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return <DesignShell><main className="legal-page"><header><span className="eyebrow">Knowvia legal</span><h1>{title}</h1><p>Last updated {updated}</p></header><article>{children}</article></main></DesignShell>;
}
