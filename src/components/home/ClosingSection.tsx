import { WaitlistForm } from "@/components/forms/WaitlistForm";

export function ClosingSection() {
  return <section id="early-list" className="closing-section"><div><h2>Know your cover. Before you need it.</h2><p>Built for health insurance, and nothing else. Join the early list and be first in.</p></div><WaitlistForm location="closing" detailed /></section>;
}
