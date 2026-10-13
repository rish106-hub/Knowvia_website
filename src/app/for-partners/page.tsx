import type { Metadata } from "next";
import Link from "next/link";
import { DesignShell } from "@/components/layout/DesignShell";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "For partners", description: "Bring clear household health-cover answers into your employee or customer experience." };

export default function PartnersPage() {
  return <DesignShell><main className="partner-page"><section><span className="eyebrow">For HR platforms, insurance platforms and advisers</span><h1>Fewer policy questions. Better ones.</h1><p>Knowvia can sit where your customers and employees already meet their health cover. They see what their documents prove, what is unclear, and what to do next.</p><a className="button" href={`mailto:${site.contactEmail}?subject=Knowvia pilot`}>Talk to us about a pilot</a></section><section className="partner-model"><article><span>01</span><h2>After joining</h2><p>Help employees read their group cover and add the policies already present at home.</p></article><article><span>02</span><h2>After purchase or renewal</h2><p>Turn the issued policy into a clear household view with page-level sources.</p></article><article><span>03</span><h2>Before support calls</h2><p>Give people the clause, the gap, and the right question before they contact your team.</p></article></section><aside><strong>Consent stays with the person.</strong><p>No data moves without permission, field by field. Medical details remain private by default.</p></aside><Link className="text-link" href="/">Back to the main site</Link></main></DesignShell>;
}
