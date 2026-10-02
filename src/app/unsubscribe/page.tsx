import { Suspense } from "react";
import { UnsubscribeForm } from "@/components/leads/UnsubscribeForm";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Unsubscribe",
  description: "Stop Knowvia emails.",
  path: "/unsubscribe",
  noindex: true,
});

export default function UnsubscribePage() {
  return (
    <section className="wrap page-header" style={{ minHeight: "50vh" }}>
      <h1>Stop Knowvia emails</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <UnsubscribeForm />
      </Suspense>
    </section>
  );
}
