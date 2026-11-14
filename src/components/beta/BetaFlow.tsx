"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { type ApiError } from "@/lib/beta/client";
import { type Adapter, type Candidate, type CardState, pickAdapter } from "@/lib/beta/adapter";
import { trackAnswer } from "@/lib/beta/analytics";
import { MOCK_MEMBERS, SUGGESTED_QUESTIONS } from "@/lib/beta/mock";
import type { AnswerCardData, CardAction, CatalogueQuestion } from "@/lib/beta/types";
import { AnswerCard } from "./AnswerCard";
import { HospitalCard } from "./HospitalCard";
import { MicButton } from "./MicButton";
import { PolicyCard } from "./PolicyCard";
import { QuestionScreen } from "./QuestionScreen";

type Step = "start" | "hospital" | "upload" | "processing" | "product" | "questions" | "card" | "chat";
type Turn = { q: string; a?: AnswerCardData; error?: string };

const STAGES = ["Your details", "Upload", "Reading", "Your product", "Questions", "Your cover", "Ask"];
const ORDER: Step[] = ["start", "upload", "processing", "product", "questions", "card", "chat"];

const REJECTIONS: Record<string, string> = {
  NOT_INSURANCE_DOCUMENT: "That file does not look like an insurance policy. Upload your policy schedule PDF.",
  DOCUMENT_TOO_LARGE: "That file is larger than 15 MB. Upload a smaller PDF.",
  DOCUMENT_REJECTED: "We could not accept that file. Try another PDF.",
};

const msg = (e: unknown) => {
  const err = e as Partial<ApiError>;
  return (err.code && REJECTIONS[err.code]) || err.message || "Something went wrong. Try again.";
};

export function BetaFlow() {
  const [adapter] = useState<Adapter>(() => pickAdapter());
  const [step, setStep] = useState<Step>("start");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [stage, setStage] = useState("scanning");
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [version, setVersion] = useState(0);
  const [picked, setPicked] = useState("");
  const [queue, setQueue] = useState<CatalogueQuestion[]>([]);
  const [qi, setQi] = useState(0);
  const [strip, setStrip] = useState<CatalogueQuestion[]>([]);
  const [inline, setInline] = useState<CatalogueQuestion | null>(null);
  const [card, setCard] = useState<CardState | null>(null);
  const [thread, setThread] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const alive = useRef(true);
  const askBox = useRef<HTMLInputElement>(null);

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    adapter.session()
      .then(s => { if (s.signedIn && alive.current) setStep(s.hasHolding ? "product" : s.hasDocument ? "processing" : "upload"); })
      .catch(() => undefined);
  }, [adapter]);

  const run = useCallback(async (fn: () => Promise<void>) => {
    setBusy(true); setError(null);
    try { await fn(); } catch (e) { setError(msg(e)); } finally { setBusy(false); }
  }, []);

  // Step 2: poll until the policy is read.
  useEffect(() => {
    if (step !== "processing") return;
    let stop = false;
    const tick = async () => {
      try {
        const s = await adapter.status();
        if (stop) return;
        if (s.stage === "ready") { setStep("product"); return; }
        if (s.stage === "rejected" || s.stage === "failed") { setError(REJECTIONS[s.code || ""] || "We could not read that file. Try another PDF."); setStep("upload"); return; }
        setStage(s.stage);
      } catch (e) { if (!stop) { setError(msg(e)); setStep("upload"); return; } }
      if (!stop) setTimeout(tick, adapter.mock ? 300 : 2500);
    };
    tick();
    return () => { stop = true; };
  }, [step, adapter]);

  // Step 3: candidates (the registry can take a moment, so a retryable 503 keeps trying).
  useEffect(() => {
    if (step !== "product" || candidates) return;
    let stop = false;
    const tick = async () => {
      try {
        const r = await adapter.product();
        if (stop) return;
        setCandidates(r.candidates); setVersion(r.profileVersion);
        if (r.candidates.length === 1) setPicked(r.candidates[0].candidateId);
      } catch (e) {
        if (stop) return;
        if ((e as ApiError).code === "HOLDING_REGISTRY_UNAVAILABLE") { setTimeout(tick, 3000); return; }
        setError(msg(e));
      }
    };
    tick();
    return () => { stop = true; };
  }, [step, candidates, adapter]);

  // Policy card: tiles appear once the worker has read the policy.
  useEffect(() => {
    if (step !== "card") return;
    let stop = false;
    const tick = async () => {
      try {
        const r = await adapter.card();
        if (stop) return;
        if (!r) { setTimeout(tick, 3000); return; }
        setCard(r);
      } catch (e) { if (!stop) setError(msg(e)); }
    };
    tick();
    return () => { stop = true; };
  }, [step, adapter]);

  const start = () => run(async () => { await adapter.start(name, email); setStep("upload"); });
  const upload = () => run(async () => { if (!file) return; setStage("scanning"); await adapter.upload(file); setStep("processing"); });

  const confirm = () => run(async () => {
    await adapter.confirmProduct(picked, version);
    const first = await adapter.questions("before_card");
    setQueue(first); setQi(0);
    if (first.length === 0) { setStrip(await adapter.questions("strip")); setStep("card"); } else setStep("questions");
  });

  const record = async (q: CatalogueQuestion, ids: string[]) => {
    trackAnswer(q.id, ids, q.sensitivity);
    await adapter.answer(q, ids);
  };

  const answerQueued = (ids: string[]) => run(async () => {
    await record(queue[qi], ids);
    if (qi + 1 < queue.length) { setQi(qi + 1); return; }
    setStrip(await adapter.questions("strip"));
    setStep("card");
  });

  const answerInline = (ids: string[]) => run(async () => {
    if (!inline) return;
    await record(inline, ids);
    setInline(null);
    setStrip(await adapter.questions("strip"));
    const refreshed = await adapter.card(); if (refreshed) setCard(refreshed);
  });

  const openChat = () => run(async () => { await adapter.openThread(); setThread(true); setStep("chat"); });

  const ask = (text: string) => {
    const q = text.trim();
    if (!q || !thread || busy) return;
    setQuestion(""); setBusy(true);
    setTurns(t => [...t, { q }]);
    const update = (patch: Partial<Turn>) => setTurns(t => t.map((x, i) => (i === t.length - 1 ? { ...x, ...patch } : x)));
    // The card is shown only after it has been fully validated; nothing is streamed.
    adapter.ask(q).then(a => update({ a })).catch(e => update({ error: msg(e) })).finally(() => setBusy(false));
  };

  const onAction = (a: CardAction) => {
    if (a.kind !== "answer_question" || !a.questionId) return;
    adapter.questions("strip").then(all => setInline(all.find(x => x.id === a.questionId) ?? null)).catch(() => undefined);
  };

  const at = ORDER.indexOf(step === "hospital" ? "start" : step);
  return (
    <main className="beta">
      <header className="beta-head">
        <span className="beta-brand">Knowvia</span>
        <ol className="beta-steps" aria-label="Progress">
          {STAGES.map((s, i) => <li key={s} aria-current={i === at ? "step" : undefined} data-done={i < at}>{s}</li>)}
        </ol>
      </header>
      {error && <p role="alert" className="beta-error">{error}</p>}

      {step === "start" && (
        <section className="beta-card">
          <h1>Read your policy with page-level sources</h1>
          <p>Add your name and e-mail. We keep one household per e-mail.</p>
          <label>Name<input value={name} onChange={e => setName(e.target.value)} autoComplete="name" maxLength={80} /></label>
          <label>E-mail<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" maxLength={254} /></label>
          <button className="beta-button" disabled={busy || !name.trim() || !email.trim()} onClick={start}>Continue</button>
          <button type="button" className="beta-chip" onClick={() => setStep("hospital")}>I&apos;m in hospital now</button>
        </section>
      )}

      {step === "hospital" && <HospitalCard onBack={() => setStep("start")} />}

      {step === "upload" && (
        <section className="beta-card">
          <h1>Upload your policy schedule</h1>
          <p>One health insurance policy, as a PDF up to 15 MB.</p>
          <input type="file" accept="application/pdf" aria-label="Policy PDF" onChange={e => setFile(e.target.files?.[0] ?? null)} />
          {/* FOR LEGAL REVIEW: consent wording and scope. */}
          <label className="beta-check">
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} />
            <span>I allow Knowvia to store this document, and to send it to our reading service to turn the pages into text. Only you can see it. You can withdraw this and have it erased at any time.</span>
          </label>
          <button className="beta-button" disabled={busy || !file || !agreed} onClick={upload}>{busy ? "Uploading" : "Upload and read"}</button>
        </section>
      )}

      {step === "processing" && (
        <section className="beta-card" aria-live="polite">
          <h1>{stage === "scanning" ? "Checking your file" : "Reading your policy"}</h1>
          <p>This takes a minute or two. You can leave this page open.</p>
          <div className="beta-bar" aria-hidden="true"><span /></div>
        </section>
      )}

      {step === "product" && (
        <section className="beta-card">
          <h1>Is this your product?</h1>
          {!candidates && !error && <p aria-live="polite">Looking up your insurer</p>}
          {candidates && candidates.length === 0 && <p>We could not match an insurer. Your policy is still read, but we cannot confirm the product.</p>}
          {candidates && candidates.length > 0 && (
            <fieldset>
              <legend>{candidates.length === 1 ? "Confirm the match" : "Pick the closest match"}</legend>
              {candidates.map(c => (
                <label key={c.candidateId} className="beta-option">
                  <input type="radio" name="product" checked={picked === c.candidateId} onChange={() => setPicked(c.candidateId)} />
                  <span><strong>{c.productName}</strong><br />{c.insurerName}</span>
                </label>
              ))}
            </fieldset>
          )}
          <button className="beta-button" disabled={busy || !picked} onClick={confirm}>Confirm</button>
        </section>
      )}

      {step === "questions" && queue[qi] && (
        <QuestionScreen key={queue[qi].id} question={queue[qi]} index={qi} total={queue.length} members={MOCK_MEMBERS} busy={busy} onAnswer={answerQueued} />
      )}

      {step === "card" && (
        <section className="beta-card wide">
          <h1>Your cover in 60 seconds</h1>
          {!card && !error && <p aria-live="polite">Collecting the key terms</p>}
          {card && <PolicyCard tiles={card.tiles} productLine={card.productLine} onResolve={(id, pick) => { void adapter.resolveConflict(id, pick).then(() => adapter.card()).then(c => { if (c) setCard(c); }); }} />}
          {card && (inline ? (
            <QuestionScreen key={inline.id} question={inline} index={0} total={1} members={MOCK_MEMBERS} busy={busy} onAnswer={answerInline} />
          ) : strip.length > 0 && (
            <>
              <h2 className="beta-rule">Improve your card</h2>
              <div className="beta-chips">{strip.map(s => <button key={s.id} type="button" className="beta-chip" onClick={() => setInline(s)}>{s.prompt.en}</button>)}</div>
            </>
          ))}
          <button className="beta-button" disabled={busy || !card} onClick={openChat}>Ask a question</button>
        </section>
      )}

      {step === "chat" && (
        <section className="beta-card wide">
          <h1>Ask about your policy</h1>
          <div className="beta-chat" aria-live="polite">
            {turns.map((t, i) => (
              <div key={i} className="beta-turn">
                <p className="beta-q">{t.q}</p>
                {!t.a && !t.error && <p className="beta-a">Checking your policy...</p>}
                {t.error && <p className="beta-a">{t.error}</p>}
                {t.a && <AnswerCard card={t.a} onAction={onAction} onFollowup={ask} onFeedback={(h, r) => { void adapter.feedback(h, r); }} onCorrect={(id, v) => { void adapter.correct(id, v); }} />}
              </div>
            ))}
          </div>
          {inline && <QuestionScreen key={inline.id} question={inline} index={0} total={1} members={MOCK_MEMBERS} busy={busy} onAnswer={ids => { void record(inline, ids).then(() => setInline(null)); }} />}
          {turns.length === 0 && <div className="beta-chips" aria-label="Suggested questions">{SUGGESTED_QUESTIONS.map(s => <button key={s} type="button" className="beta-chip" onClick={() => ask(s)}>{s}</button>)}</div>}
          <form className="beta-ask" onSubmit={e => { e.preventDefault(); ask(question); }}>
            <input ref={askBox} value={question} onChange={e => setQuestion(e.target.value)} placeholder="For example: how long is the waiting period?" aria-label="Your question" maxLength={1000} />
            <MicButton voiceEnabled={adapter.voiceEnabled} mock={adapter.mock} transcribe={adapter.transcribe} onSend={ask} onBusy={() => askBox.current?.focus()} disabled={busy} />
            <button className="beta-button" disabled={busy || !question.trim()}>Ask</button>
          </form>
        </section>
      )}
    </main>
  );
}
