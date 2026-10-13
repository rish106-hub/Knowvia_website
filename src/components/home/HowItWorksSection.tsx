import Link from "next/link";
import { StatusPill } from "@/components/ui/StatusPill";

const moments = [
  ["Room rent.", "You learn the room limit when the bill arrives.", "You see the room limit, and its page, before you choose a room."],
  ["Who is covered.", "You are not sure who is still on the family policy.", "Every person has a row: known, not confirmed, or missing."],
  ["Cash.", "You look for an ATM while the admission waits.", "You know how much cash to keep ready, and why."],
  ["Leaving a job.", "You get an end date. Nobody tells you how to keep your cover.", "The deadline to keep your cover is already on your page."],
  ["Buying more.", "A relative says the top-up is cheap.", "You see what the top-up adds, and what it does not."],
];

export function HowItWorksSection() {
  return <>
    <section className="contrast-section" aria-labelledby="contrast-heading">
      <div className="section-heading"><h2 id="contrast-heading">Stop finding out at the hospital desk.</h2><p>The same five moments, two ways.</p></div>
      <div className="comparison-grid">
        <div className="comparison-old"><header><span>At the hospital desk</span><strong>2 a.m.</strong></header>{moments.map(([title, old]) => <p key={title}><b>{title}</b> {old}</p>)}</div>
        <div className="comparison-new"><header><span>The better way</span><strong>With Knowvia</strong></header>{moments.map(([title, , better]) => <p key={title}><b>{title}</b> {better}</p>)}<h3>Walk in already knowing your limits, your gaps and your next step.</h3><Link className="button button-light" href="#early-list">Join the early list</Link></div>
      </div>
    </section>
    <section id="how" className="how-section">
      <div className="section-heading"><h2>See three answers for every person.</h2><p>When Knowvia opens, add the health policies you already have. It reads them person by person.</p></div>
      <div className="bento-grid">
        <article className="bento-known"><StatusPill kind="known" /><h3>What your documents prove, with the page.</h3><ul><li><span>Sum insured</span><b>₹5,00,000</b><small>Page 2</small></li><li><span>Maa is enrolled as a dependant</span><small>Page 4</small></li><li><span>Waiting period for cataract: 2 years</span><small>Page 11</small></li></ul></article>
        <article className="bento-unknown"><StatusPill kind="unknown" /><h3>Missing or unclear? We mark it.</h3><p><strong>We never guess.</strong> If two documents disagree, both stay visible and we name who can answer.</p></article>
        <article className="bento-next"><StatusPill kind="next" /><h3>One step, who does it, and by when.</h3><p>Not a lecture about what you should have done.</p></article>
      </div>
    </section>
    <blockquote className="family-quote">“I can’t say ‘an app told me.’ I can say ‘it says here, <em>page fourteen</em>.’”<cite>M., 29, Bengaluru</cite></blockquote>
  </>;
}
