"use client";

import { useEffect, useRef, useState } from "react";
import { type Recording, startRecording } from "@/lib/beta/recorder";
import { isVoiceBusy } from "@/lib/beta/adapter";
import { MAX_RECORD_SECONDS } from "@/lib/beta/wav";

export const BUSY_MESSAGE = "Busy, type instead";
const COUNTDOWN_FROM = 5;

type Phase = "idle" | "recording" | "transcribing" | "confirm";
type Props = {
  voiceEnabled: boolean;
  mock?: boolean;
  /** Turns a recording into text. Mock mode returns a canned transcript. */
  transcribe: (blob: Blob | null) => Promise<string>;
  /** Called with the confirmed text when the person taps Send. */
  onSend: (text: string) => void;
  disabled?: boolean;
  /** Called when voice is busy so the caller can focus the text box. No transcript is produced. */
  onBusy?: () => void;
};

export function MicButton({ voiceEnabled, mock, transcribe, onSend, disabled, onBusy }: Props) {
  const [phase, setPhase] = useState<Phase>("idle");
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [failed, setFailed] = useState(false);
  const [busyMsg, setBusyMsg] = useState(false);
  const rec = useRef<Recording | null>(null);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const live = useRef(false);
  const held = useRef(false);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); rec.current?.stop(); }, []);
  if (!voiceEnabled) return null;

  const finish = async (blob: Blob | null) => {
    setPhase("transcribing");
    try { setText(await transcribe(blob)); setEditing(false); setPhase("confirm"); } catch (e) { if (isVoiceBusy(e)) { setBusyMsg(true); onBusy?.(); } else setFailed(true); setPhase("idle"); }
  };

  const stop = () => {
    held.current = false;
    if (!live.current) return;
    live.current = false;
    if (timer.current) clearInterval(timer.current);
    const r = rec.current;
    rec.current = null;
    void finish(r ? r.stop() : null); // WAV, 16 kHz mono 16-bit, audio/wav. Mock mode has no recording and gets a canned transcript.
  };

  const start = async () => {
    if (live.current || disabled || phase !== "idle") return;
    held.current = true;
    setFailed(false); setBusyMsg(false); setSeconds(0);
    let stream: MediaStream | null = null;
    try { stream = await navigator.mediaDevices.getUserMedia({ audio: true }); } catch { if (!mock) { setFailed(true); return; } }
    try { rec.current = stream ? await startRecording(stream) : null; } catch { stream?.getTracks().forEach(t => t.stop()); if (!mock) { setFailed(true); return; } rec.current = null; }
    if (!held.current) { rec.current?.stop(); rec.current = null; return; } // released before recording began
    live.current = true;
    setPhase("recording");
    timer.current = setInterval(() => setSeconds(s => { if (s + 1 >= MAX_RECORD_SECONDS) { setTimeout(stop, 0); } return s + 1; }), 1000);
  };

  if (phase === "confirm") {
    return (
      <div className="beta-transcript" aria-live="polite">
        {editing ? <input value={text} onChange={e => setText(e.target.value)} aria-label="Edit what we heard" maxLength={1000} /> : <p className="beta-chip" data-static="true">{text}</p>}
        <div className="beta-chips">
          <button type="button" className="beta-button" disabled={!text.trim()} onClick={() => { onSend(text.trim()); setPhase("idle"); }}>Send</button>
          {!editing && <button type="button" className="beta-chip" onClick={() => setEditing(true)}>Edit</button>}
          <button type="button" className="beta-chip" data-quiet="true" onClick={() => setPhase("idle")}>Cancel</button>
        </div>
      </div>
    );
  }
  return (
    <div className="beta-mic">
      <button type="button" className="beta-chip beta-mic-button" aria-label={phase === "recording" ? "Release to stop" : "Hold to talk"} aria-pressed={phase === "recording"} disabled={disabled || phase === "transcribing"}
        onPointerDown={() => void start()} onPointerUp={stop} onPointerLeave={stop} onPointerCancel={stop}
        onKeyDown={e => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); void start(); } }}
        onKeyUp={e => { if (e.key === " " || e.key === "Enter") stop(); }}>
        {phase === "recording" ? seconds >= MAX_RECORD_SECONDS - COUNTDOWN_FROM ? `${Math.max(0, MAX_RECORD_SECONDS - seconds)}s left` : `Listening ${seconds}s` : phase === "transcribing" ? "Listening to you" : "Hold to talk"}
      </button>
      {busyMsg && <span className="beta-note" role="status">{BUSY_MESSAGE}</span>}
      {failed && <span className="beta-note" role="status">We could not hear that. Try again or type.</span>}
    </div>
  );
}
