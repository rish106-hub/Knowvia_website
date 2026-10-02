import Link from "next/link";
import { PageHeader } from "@/components/marketing/PageHeader";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Trust and security",
  description:
    "Knowvia's product boundaries, evidence model, and how this website protects the little personal data it collects.",
  path: "/trust",
});

export default function TrustPage() {
  return (
    <>
      <PageHeader
        title="Trust, in specifics"
        lede="What Knowvia will and will not do, how every answer is tied to evidence, and how this website handles your data."
        path="/trust"
      />
      <section className="section-tight">
        <div className="wrap two-col">
          <div className="prose">
            <h2>Product boundaries</h2>
            <p className="muted">
              Knowvia is in early access. These are the rules the product is built to follow, and we will publish any
              change to them here.
            </p>
            <ul>
              <li>Knowvia explains documents. Insurers decide claims.</li>
              <li>Nothing is sent to an insurer, employer or hospital without your explicit confirmation.</li>
              <li>HR teams see enrolment counts and open tasks, never an employee&apos;s health details.</li>
              <li>Household access is agreed by the people involved and can be withdrawn.</li>
            </ul>
            <h2>Evidence model</h2>
            <p>
              Knowvia is designed so that every fact it shows is linked to the document and page it came from. When
              documents disagree or are silent, the item is marked unknown and stays that way until someone with
              authority, usually the insurer, confirms it. Calculations use fixed rules, not a language model, and are
              labelled as estimates.
            </p>
          </div>
          <div className="prose">
            <h2>This website</h2>
            <ul>
              <li>Collects an email address for early access, and nothing about your health or policies.</li>
              <li>Stores that email encrypted, separate from any product data.</li>
              <li>Uses double opt-in: no emails until you confirm.</li>
              <li>Loads no analytics or advertising code until you allow it, and records no sessions.</li>
              <li>The floating guide only links to pages on this site. It does not read or store anything you type.</li>
              <li>Sends strict browser security headers, including a content security policy and framing protection.</li>
            </ul>
            <h2>Reporting a security issue</h2>
            <p>
              If you find a vulnerability, write to the privacy contact in the <Link href="/privacy">privacy notice</Link>.
              Please do not test against other people&apos;s data.
            </p>
            <p className="small muted">
              We do not hold security certifications yet, and we will not claim any until an independent audit is
              complete.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
