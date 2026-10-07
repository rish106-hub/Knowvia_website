import { ArrowRight, Check, MagnifyingGlass, Question } from "@phosphor-icons/react/ssr";
import styles from "./PolicyClarityDemo.module.css";

const questions = [
  "Am I covered?",
  "Which plan first?",
  "Room limit?",
  "Parents covered?",
  "Covered or not?",
  "Anything missing?",
] as const;

export function PolicyClarityDemo() {
  return (
    <div className={styles.shell} aria-label="Common health cover questions brought into one clear view">
      <div className={styles.orbit} aria-hidden="true" />
      <div className={styles.questions} aria-label="Common questions">
        {questions.map((question) => (
          <span key={question} className={styles.question}>{question}</span>
        ))}
      </div>

      <div className={styles.answerCard}>
        <div className={styles.askBar}>
          <MagnifyingGlass size={18} weight="bold" aria-hidden />
          <span>Which plan first?</span>
        </div>
        <div className={styles.answerFlow}>
          <div data-tone="known">
            <Check size={19} weight="bold" aria-hidden />
            <span>Room cap</span>
            <strong>₹5,000/day</strong>
          </div>
          <div data-tone="unclear">
            <Question size={19} weight="bold" aria-hidden />
            <span>Mismatch</span>
            <strong>2 amounts</strong>
          </div>
          <div data-tone="next">
            <ArrowRight size={19} weight="bold" aria-hidden />
            <span>Do next</span>
            <strong>Ask insurer</strong>
          </div>
        </div>
        <p className={styles.source}>Open the exact page behind every answer.</p>
      </div>
    </div>
  );
}
