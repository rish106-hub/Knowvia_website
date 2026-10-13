import { WaitlistForm } from "@/components/forms/WaitlistForm";
import { StatusPill } from "@/components/ui/StatusPill";
import Image from "next/image";

export function HeroSection() {
  return <section id="top" className="hero-section">
    <div className="hero-inner">
      <div className="hero-copy">
        <h1><span>Health insurance</span>, read before the hospital does.</h1>
        <p className="lead">Knowvia reads every health policy in your family: employer, personal and parents’. See what is covered, what is unclear, and what to do next.</p>
        <ul className="policy-tabs" aria-label="Health policies Knowvia reads">
          <li>Employer group cover</li><li>Family floater</li><li>Parents’ policy</li><li>Super top-up</li>
        </ul>
        <WaitlistForm location="hero" />
        <div className="support-row"><span>Supported by</span><Image src="/logos/lightspeed.png" alt="Lightspeed" width={132} height={28} /><i /><Image src="/logos/insurance-samadhan.png" alt="Insurance Samadhan" width={171} height={33} /></div>
      </div>
      <div className="hero-art" role="group" aria-label="Example: Knowvia reading a health top-up quote">
        <div className="quote-paper">
          <div><strong>SUPER TOP-UP QUOTE</strong><span>Page 1 of 6</span></div>
          <i />
          <p><span>Sum insured</span><b>₹20,00,000</b></p>
          <p className="highlight"><span>Deductible</span><b>₹10,00,000</b></p>
          <p><span>Annual premium</span><b>₹9,400</b></p>
        </div>
        <div className="reading-card">
          <header><span>Example</span><small>2 documents read</small></header>
          <h2>A top-up quote, read before paying</h2>
          <div className="reading-trail">
            <article><StatusPill kind="known" /><p>Your base cover is ₹8,00,000</p></article>
            <article><StatusPill kind="known" /><p>The top-up pays only after ₹10,00,000</p></article>
            <article><StatusPill kind="unknown" /><p>Room-rent limit in your base policy</p></article>
            <article><StatusPill kind="next" /><p><strong>Before you pay ₹9,400, ask about the ₹2,00,000 gap.</strong></p></article>
          </div>
        </div>
      </div>
    </div>
  </section>;
}
