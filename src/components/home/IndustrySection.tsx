import { industryStats, policyTerms } from "@/content/landing";
import Image from "next/image";

const sources = [
  ["lok-sabha.png", "Lok Sabha, Parliament of India"],
  ["ministry-of-finance.png", "Ministry of Finance, Government of India"],
  ["irdai.png", "Insurance Regulatory and Development Authority of India"],
  ["ministry-of-health.png", "Ministry of Health and Family Welfare"],
  ["localcircles.png", "LocalCircles"],
];

export function IndustrySection() {
  return <>
    <section id="industry" className="industry-section">
      <div className="section-heading on-dark"><span>Across India, not just in our research</span><h2>This keeps happening to families.</h2></div>
      <div className="source-strip"><small>Where these numbers come from</small><div>{sources.map(([file, alt]) => <Image key={file} src={`/logos/${file}`} alt={alt} width={170} height={40} />)}</div></div>
      <div className="stat-track" role="region" aria-label="Industry numbers. Scroll sideways for more.">
        {industryStats.map((stat) => <article className={`stat-card stat-${stat.tone}`} key={stat.value}><strong>{stat.value}</strong><p>{stat.body}</p><div className="chart-lines" aria-hidden="true"><i /><i /><i /><i /><i /></div><small>{stat.source}</small></article>)}
      </div>
      <p className="industry-note">Knowvia cannot overrule an insurer. It changes the part you control: knowing your cover, and its rules, before the desk does.</p>
    </section>
    <section className="terms-section" aria-labelledby="terms-heading">
      <div><h2 id="terms-heading">Every clause that decides your bill.</h2><p>Built only for health cover. We explain each of these in plain words, with the page it sits on.</p></div>
      <ul>{policyTerms.map((term) => <li key={term}>{term}</li>)}</ul>
    </section>
  </>;
}
