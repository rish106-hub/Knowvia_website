"use client";

import { ArrowLeft, ArrowRight, FileArrowUp, Plus, ShieldCheck } from "@phosphor-icons/react";
import { ChangeEvent, FormEvent, useState } from "react";
import { exampleMembers, onboardingEvents } from "@/content/onboarding";
import { BrandMark } from "@/components/ui/BrandMark";
import { StatusPill } from "@/components/ui/StatusPill";

export function OnboardingFlow() {
  const [step, setStep] = useState(1);
  const [events, setEvents] = useState<string[]>([]);
  const [files, setFiles] = useState<string[]>([]);

  function next(event?: FormEvent) { event?.preventDefault(); setStep((value) => Math.min(7, value + 1)); }
  function previous() { setStep((value) => Math.max(1, value - 1)); }
  function addFiles(event: ChangeEvent<HTMLInputElement>) { setFiles(Array.from(event.target.files || []).map((file) => file.name)); }

  if (step === 6) return <div className="reading-screen"><BrandMark /><div className="reading-orbit" aria-hidden="true"><i /><i /><i /></div><span>Reading your documents</span><ul><li>Found: 2 policy schedules</li><li>Found: 4 members across both</li><li>Found: sum insured ₹5,00,000</li><li>Not found: room-rent clause</li></ul><p>You can leave this page. We will email you when it is ready.</p><button className="button" onClick={() => setStep(7)}>See what we found</button></div>;
  if (step === 7) return <CoverageMatrix onRestart={() => setStep(1)} />;

  return <main className="onboarding-shell">
    <header><BrandMark /><span>Step {step} of 5</span></header>
    <div className="progress" aria-label={`Step ${step} of 5`}><i style={{ width: `${step * 20}%` }} /></div>
    <section className="onboarding-card">
      {step > 1 && <button className="back-button" onClick={previous}><ArrowLeft size={18} />Back</button>}
      {step === 1 && <form onSubmit={next}><span className="step-label">Step 1 of 5</span><h1>Start with your own cover.</h1><p>Use your email or phone. We will send a one-time code, so there is no password to remember.</p><label>Email or phone<input required name="identity" inputMode="email" placeholder="you@example.com" /></label><small>If you use a phone number, enter the 10 digits without the country code.</small><button className="button">Send code <ArrowRight /></button><small>By continuing you agree to the <a href="/terms">terms</a> and <a href="/privacy">privacy notice</a>.</small></form>}
      {step === 2 && <form onSubmit={next}><span className="step-label">Step 2 of 5</span><h1>What is coming up?</h1><p>This tells us what to read first.</p><fieldset><legend>What is coming up</legend>{onboardingEvents.map((item) => <label className="select-card" key={item}><input type="checkbox" checked={events.includes(item)} onChange={(e) => setEvents(e.target.checked ? [...events, item] : events.filter((value) => value !== item))} />{item}</label>)}</fieldset><button className="button">Continue <ArrowRight /></button></form>}
      {step === 3 && <div><span className="step-label">Step 3 of 5</span><h1>Who is in your family’s cover?</h1><p>Add anyone whose policy you help with: a partner, children, parents or a sibling.</p><div className="member-list">{exampleMembers.map((member) => <div key={member.name}><span>{member.name.slice(0, 1)}</span><p><strong>{member.name}</strong><small>{member.relationship ? `${member.relationship}, ` : ""}{member.age}</small></p></div>)}</div><button className="outline-button"><Plus />Add a person</button><p className="info-note">Adults you add get an invite to confirm what they share.</p><button className="button" onClick={() => setStep(4)}>Continue <ArrowRight /></button></div>}
      {step === 4 && <div><span className="step-label">Step 4 of 5</span><h1>Choose what you share.</h1><p>You decide for your own record. Each adult you added decides for theirs.</p><div className="sharing-panel"><strong>You</strong>{["Cover amount", "Policy details", "Medical details"].map((item, index) => <div key={item}><span>{item}</span><label><input type="radio" name={item} defaultChecked={index < 2} />Shared with family</label><label><input type="radio" name={item} defaultChecked={index === 2} />Only me</label></div>)}</div><label className="emergency-choice"><input type="checkbox" /> <span><strong>Emergency access, set in advance</strong><small>One person you choose sees everything if you cannot speak for yourself.</small></span></label><p className="info-note">Maa, Papa and your brother decide for themselves.</p><button className="button" onClick={() => setStep(5)}>Continue <ArrowRight /></button></div>}
      {step === 5 && <div><span className="step-label">Step 5 of 5</span><h1>Add the policies you have.</h1><label className="upload-zone"><FileArrowUp size={36} /><strong>Drop a PDF or photo here, or choose a file</strong><small>PDF, JPG or PNG, up to 15 MB each</small><input type="file" multiple accept=".pdf,.jpg,.jpeg,.png" onChange={addFiles} /><span className="outline-button">Choose a file</span></label><div className="file-types"><span>Policy schedule</span><span>Policy wording</span><span>Employer benefits booklet</span><span>Renewal notice</span><span>Quote</span></div>{files.length > 0 && <ul className="upload-list">{files.map((file) => <li key={file}>{file}<ShieldCheck size={20} /></li>)}</ul>}<button className="button" onClick={() => setStep(6)}>Read my documents <ArrowRight /></button><p className="secure-note"><ShieldCheck />Files are encrypted. Only people you allow can see them.</p></div>}
    </section>
  </main>;
}

function CoverageMatrix({ onRestart }: { onRestart: () => void }) {
  const rows = [
    ["You, 33", "Employer group policy", "Sum insured ₹5,00,000", "Room-rent limit", "Ask HR for the full benefits booklet"],
    ["Maa, 58", "On your employer policy", "Enrolled as a dependant", "What happens if you change jobs", "Note the date your cover would end"],
    ["Papa, 61", "Family floater", "Floater cover ₹3,00,000", "Renewal date", "Ask Papa for his renewal notice"],
    ["Brother, 24", "On Papa’s floater", "Enrolled", "Date of birth disagrees", "Ask the insurer to correct the date of birth"],
  ];
  return <main className="matrix-page"><header><BrandMark /><button className="text-button" onClick={onRestart}>Start again</button></header><div className="matrix-heading"><span className="eyebrow">Example</span><h1>Your family’s cover</h1><p>Read from 2 documents, 13 October 2026</p></div><div className="matrix-grid">{rows.map(([person, policy, known, unknown, next]) => <article key={person}><header><h2>{person}</h2><span>{policy}</span></header><div><StatusPill kind="known" /><p>{known}</p><small>Policy schedule</small></div><div><StatusPill kind="unknown" /><p>{unknown}</p></div><div><StatusPill kind="next" /><p>{next}</p><small>You, this week</small></div></article>)}</div></main>;
}
