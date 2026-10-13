import { familyStories } from "@/content/landing";

export function StoriesSection() {
  return <section id="stories" className="stories-section">
    <div className="section-heading"><h2>Four details hid in plain sight.</h2><p>Each one was in a health policy the family already had.</p></div>
    <div className="story-grid">{familyStories.map((story, index) => <article className={`story-card story-${index + 1}`} key={story.value}><strong>{story.value}</strong><p>{story.body}</p><div className={`story-visual visual-${story.kind}`} aria-hidden="true"><i /><i /><i /><i /><i /><i /></div><small>Example from family research</small></article>)}</div>
    <div className="document-result"><strong>7 of 19</strong><p>policy documents had a detail that did not match what the family believed.</p><div aria-hidden="true">{Array.from({ length: 19 }, (_, index) => <i className={index < 7 ? "mismatch" : ""} key={index} />)}</div></div>
  </section>;
}
