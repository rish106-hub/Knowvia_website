"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { api, type ApiError, type ChatAnswer, formatValue, prettyKey, readAnswer } from "@/lib/beta/client";

type Step = "start" | "upload" | "processing" | "product" | "declarations" | "card" | "chat";
type Candidate = { candidateId: string; insurerName: string; productName: string };
type Fact = { factKey: string; status: string; value: unknown; unit?: string | null; sources?: { quote?: string | null; page?: { pageId?: string; documentKind?: string | null } | null }[] };
type Turn = { q: string; a?: ChatAnswer; error?: string };

const KINDS = [
  { value: "pre_existing_disease", label: "A health condition I already had" },
  { value: "prior_condition", label: "A past condition or treatment" },
  { value: "habit", label: "A habit (for example smoking)" },
  { value: "occupation", label: "My occupation" },
  { value: "nominee", label: "A nominee" },
  { value: "other", label: "Something else" },
];
const STAGES = ["Your details", "Upload", "Reading", "Your product", "At purchase", "Your cover", "Ask"];
const ORDER: Step[] = ["start", "upload", "processing", "product", "declarations", "card", "chat"];

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
  const [declared, setDeclared] = useState<Record<string, string>>({});
  const [facts, setFacts] = useState<Fact[] | null>(null);
  const [productLine, setProductLine] = useState("");
  const [thread, setThread] = useState<string | null>(null);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [question, setQuestion] = useState("");
  const [memory, setMemory] = useState<string | null>(null);
  const alive = useRef(true);

  useEffect(() => { alive.current = true; return () => { alive.current = false; }; }, []);
  useEffect(() => {
    api<{ signedIn: boolean; hasDocument: boolean; hasHolding: boolean }>("/api/beta/session")
      .then(s => { if (s.signedIn && alive.current) setStep(s.hasHolding ? "product" : s.hasDocument ? "processing" : "upload"); })
      .catch(() => undefined);
  }, []);

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
        const s = await api<{ stage: string; code?: string }>("/api/beta/status");
        if (stop) return;
        if (s.stage === "ready") { setStep("product"); return; }
        if (s.stage === "rejected" || s.stage === "failed") { setError(REJECTIONS[s.code || ""] || "We could not read that file. Try another PDF."); setStep("upload"); return; }
        setStage(s.stage);
      } catch (e) { if (!stop) { setError(msg(e)); setStep("upload"); return; } }
      if (!stop) setTimeout(tick, 2500);
    };
    tick();
    return () => { stop = true; };
  }, [step]);

  // Step 3: candidates (the registry can take a moment, so a retryable 503 keeps trying).
  useEffect(() => {
    if (step !== "product" || candidates) return;
    let stop = false;
    const tick = async () => {
      try {
        const r = await api<{ profileVersion: number; candidates: Candidate[] }>("/api/beta/product");
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
  }, [step, candidates]);

  // Step 5: facts appear once the worker has read the policy.
  useEffect(() => {
    if (step !== "card") return;
    let stop = false;
    const tick = async () => {
      try {
        const r = await api<{ facts: { facts: Fact[] }; holding: { summary?: { insurerName?: string; productName?: string } } }>("/api/beta/facts");
        if (stop) return;
        const s = r.holding.summary;
        if (s?.insurerName) setProductLine(`${s.insurerName} ${s.productName || ""}`.trim());
        if (r.facts.facts.length === 0) { setTimeout(tick, 3000); return; }
        setFacts(r.facts.facts);
      } catch (e) { if (!stop) setError(msg(e)); }
    };
    tick();
    return () => { stop = true; };
  }, [step]);

  const start = () => run(async () => {
    await api("/api/beta/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ name, email }) });
    setStep("upload");
  });

  const upload = () => run(async () => {
    if (!file) return;
    setStage("scanning");
    await api("/api/beta/documents", { method: "POST", headers: { "content-type": "application/pdf", "x-consent-confirmed": "true", "x-filename": file.name }, body: file });
    setStep("processing");
  });

  const confirm = () => run(async () => {
    await api("/api/beta/product", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ candidateId: picked, expectedVersion: version }) });
    setStep("declarations");
  });

  const saveDeclarations = () => run(async () => {
    const items = Object.entries(declared).filter(([, v]) => v.trim()).map(([kind, label]) => ({ kind, label }));
    if (items.length) await api("/api/beta/declarations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ items }) });
    setStep("card");
  });

  const openChat = () => run(async () => {
    if (!thread) setThread((await api<{ threadId: string }>("/api/beta/chat/threads", { method: "POST" })).threadId);
    api<{ available: boolean; text?: string }>("/api/beta/memory-document").then(m => { if (m.available && m.text) setMemory(m.text); }).catch(() => undefined);
    setStep("chat");
  });

  const ask = () => {
    const q = question.trim();
    if (!q || !thread || busy) return;
    setQuestion(""); setBusy(true);
    setTurns(t => [...t, { q }]);
    const update = (patch: Partial<Turn>) => setTurns(t => t.map((x, i) => (i === t.length - 1 ? { ...x, ...patch } : x)));
    fetch("/api/beta/chat/turn", { method: "POST", credentials: "same-origin", headers: { "content-type": "application/json" }, body: JSON.stringify({ threadId: thread, message: q }) })
      .then(readAnswer).then(a => update({ a })).catch(e => update({ error: msg(e) })).finally(() => setBusy(false));
  };

  const at = ORDER.indexOf(step);
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
        </section>
      )}

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

      {step === "declarations" && (
        <section className="beta-card">
          <h1>What did you tell the insurer when you bought it?</h1>
          <p>Tick what applies and add a few words. Leave everything empty if nothing applies.</p>
          {/* FOR LEGAL REVIEW: declaration wording and the health-data permission it relies on. */}
          {KINDS.map(k => (
            <label key={k.value}>{k.label}
              <input value={declared[k.value] ?? ""} onChange={e => setDeclared(d => ({ ...d, [k.value]: e.target.value }))} maxLength={300} />
            </label>
          ))}
          <p className="beta-note">Saving these lets us keep them with your policy. Only you can see them.</p>
          <button className="beta-button" disabled={busy} onClick={saveDeclarations}>Save and see my cover</button>
        </section>
      )}

      {step === "card" && (
        <section className="beta-card wide">
          <h1>Your cover in 60 seconds</h1>
          {productLine && <p className="beta-product">{productLine}</p>}
          {!facts && !error && <p aria-live="polite">Collecting the key terms</p>}
          {facts && (
            <ul className="beta-facts">
              {facts.map(f => (
                <li key={f.factKey} data-status={f.status}>
                  <span className="beta-label">{prettyKey(f.factKey)}</span>
                  <strong>{f.status === "unknown" || f.value == null ? "Your policy doesn't say" : formatValue(f.value, f.unit)}</strong>
                  {f.status === "conflicting" && <em>Your documents differ here. Check with your insurer.</em>}
                  {f.sources?.filter(s => s.page || s.quote).slice(0, 2).map((s, i) => (
                    <small key={i}>{s.page?.documentKind ? `From your ${s.page.documentKind.replace("policy_", "")}` : "From your policy"}{s.quote ? `: "${s.quote}"` : ""}</small>
                  ))}
                </li>
              ))}
            </ul>
          )}
          <button className="beta-button" disabled={busy || !facts} onClick={openChat}>Ask a question</button>
        </section>
      )}

      {step === "chat" && (
        <section className="beta-card wide">
          <h1>Ask about your policy</h1>
          <div className="beta-chat" aria-live="polite">
            {turns.map((t, i) => (
              <div key={i} className="beta-turn">
                <p className="beta-q">{t.q}</p>
                {!t.a && !t.error && <p className="beta-a">Looking through your policy</p>}
                {t.error && <p className="beta-a">{t.error}</p>}
                {t.a && (
                  <div className="beta-a" data-status={t.a.status}>
                    <p>{t.a.status === "unknown" ? "Your policy doesn't say." : t.a.answer}</p>
                    {t.a.status === "unknown" && t.a.answer && <p className="beta-note">{t.a.answer}</p>}
                    {t.a.sources.map((s, j) => s.quote || s.page ? <small key={j}>{s.page ? `Page ${s.page}` : "Your policy"}{s.quote ? `: "${s.quote}"` : ""}</small> : null)}
                  </div>
                )}
              </div>
            ))}
          </div>
          <form className="beta-ask" onSubmit={e => { e.preventDefault(); ask(); }}>
            <input value={question} onChange={e => setQuestion(e.target.value)} placeholder="For example: how long is the waiting period?" aria-label="Your question" maxLength={1000} />
            <button className="beta-button" disabled={busy || !question.trim()}>Ask</button>
          </form>
          {memory && <details className="beta-memory"><summary>Your policy notes</summary><pre>{memory}</pre></details>}
        </section>
      )}
    </main>
  );
}
