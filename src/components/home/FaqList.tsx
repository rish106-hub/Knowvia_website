"use client";

import { Plus } from "@phosphor-icons/react";
import { useState } from "react";
import { faqs } from "@/content/landing";

export function FaqList() {
  const [open, setOpen] = useState(0);
  return <div className="faq-list">{faqs.map(([question, answer], index) => {
    const expanded = open === index;
    return <article className={`faq-item ${expanded ? "is-open" : ""}`} key={question}>
      <h3><button type="button" aria-expanded={expanded} aria-controls={`faq-answer-${index}`} onClick={() => setOpen(expanded ? -1 : index)}><span>{question}</span><Plus aria-hidden="true" size={20} /></button></h3>
      {expanded && <p id={`faq-answer-${index}`}>{answer}</p>}
    </article>;
  })}</div>;
}
