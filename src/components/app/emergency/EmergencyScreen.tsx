import Link from "next/link";
import { ArrowLeft, Phone } from "@phosphor-icons/react/ssr";
import css from "../start/start.module.css";

// S01. Static guidance. No session, no fetch, nothing stored. All wording here is DRAFT, for MEDICAL AND LEGAL REVIEW.
const STEPS = [
  "Carry your e-card, photo ID and policy number",
  "Ask the hospital insurance or TPA desk about cashless pre-authorisation",
  "Call the helpline printed on your health card",
  "Keep every bill and report",
] as const;

export function EmergencyScreen() {
  return (
    <div className={css.screen}>
      <Link href="/app/start" className={css.back}>
        <ArrowLeft size={20} weight="regular" aria-hidden="true" />
        Back
      </Link>

      <h1 className={css.h1}>Someone needs care now</h1>

      <div className={css.callBand}>
        <p className={css.callText}>If life is at risk, call emergency services first.</p>
        <a href="tel:112" className={css.callButton}>
          <Phone size={20} weight="regular" aria-hidden="true" />
          <span>Call 112</span>
          <span className={css.callSub}>(national emergency number)</span>
        </a>
      </div>

      <ol className={css.steps} aria-label="What to do next">
        {STEPS.map((text, index) => (
          <li key={text} className={css.step}>
            <span className={css.num} aria-hidden="true">
              {index + 1}
            </span>
            <span>{text}</span>
          </li>
        ))}
      </ol>

      <div className={css.foot}>
        <Link href="/app/sign-in?mode=emergency" className={`${css.pill} ${css.pillPrimary}`}>
          Save this and add my e-card
        </Link>
        <div className={css.reviewRow}>
          <p className={css.footNote}>General guidance. Not medical advice and not a claim decision. Seek emergency care first.</p>
          <span className={css.review}>MEDICAL AND LEGAL REVIEW</span>
        </div>
      </div>
    </div>
  );
}
