import Link from "next/link";
import { FaqList } from "./FaqList";
import { PrivacyViewer } from "./PrivacyViewer";
import { promises } from "@/content/landing";
import { site } from "@/lib/site";

export function TrustAndPartnerSections() {
  return <>
    <section id="privacy" className="privacy-section">
      <div><h2>Each person decides what family sees.</h2><p>Share the cover amount with your family. Keep medical details to yourself. Change it whenever you like. Every adult controls their own record.</p><strong>Medical details are never shared by default.</strong></div>
      <PrivacyViewer />
    </section>
    <section id="partners" className="partners-section">
      <div><span>For HR platforms, insurance platforms and advisers</span><h2>Cut “what does my policy cover?” calls.</h2><p>Knowvia can sit where your customers and employees already meet their health cover. They get a clear view of every policy in their household. You keep your own support relationship.</p><Link className="button" href="/for-partners">Talk to us about a pilot</Link></div>
      <ul><li><b>HR platforms:</b> at joining or a benefits change, with the employee’s permission.</li><li><b>Insurance platforms and advisers:</b> after a purchase or renewal, linked to the issued policy.</li><li>No data moves without the person’s consent, field by field.</li></ul>
    </section>
    <section id="questions" className="faq-section">
      <div className="faq-intro"><h2>Questions families ask us</h2><aside><h3>Still have a question?</h3><p>Write to us. A person replies, not a bot.</p><a className="button button-light button-small" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a></aside></div>
      <FaqList />
    </section>
    <section id="promises" className="promises-section"><div className="section-heading"><h2>What we will not do</h2><p>Five lines we will not cross. Hold us to them.</p></div><ol>{promises.map(([title, body], index) => <li key={title}><span>{String(index + 1).padStart(2, "0")}</span><p><strong>{title}</strong>: we will not do this. {body}</p></li>)}</ol><p className="promise-close">That leaves the one job that matters: reading your family’s health cover with you, before you need it.</p></section>
  </>;
}
