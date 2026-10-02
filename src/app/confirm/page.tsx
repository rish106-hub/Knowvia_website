import { Suspense } from "react";
import { ConfirmSubscription } from "@/components/leads/ConfirmSubscription";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Confirm your email",
  description: "Confirm your Knowvia early-access email.",
  path: "/confirm",
  noindex: true,
});

export default function ConfirmPage() {
  return (
    <section className="wrap page-header" style={{ minHeight: "50vh" }}>
      <h1>Confirm your email</h1>
      <Suspense fallback={<p>Loading…</p>}>
        <ConfirmSubscription />
      </Suspense>
    </section>
  );
}
