import Link from "next/link";
import { ArrowRight, Buildings, HouseLine } from "@phosphor-icons/react/ssr";
import styles from "./AudiencePanel.module.css";

export function AudiencePanel() {
  return (
    <div className={styles.grid}>
      <Link href="/for-families" className={styles.family}>
        <HouseLine size={26} weight="bold" aria-hidden />
        <span className={styles.kicker}>For families</span>
        <h2>3 policies. 1 clear household view.</h2>
        <p>Line up employer, family and parents&apos; cover before anyone needs it.</p>
        <span className={styles.link}>See the family view <ArrowRight size={18} aria-hidden /></span>
      </Link>
      <Link href="/for-employers" className={styles.employer}>
        <Buildings size={24} weight="bold" aria-hidden />
        <span className={styles.kicker}>For employers</span>
        <h3>Make the benefit understandable.</h3>
        <p>Give employees clarity while HR sees only enrolment counts and open tasks.</p>
        <span className={styles.link}>See the employer view <ArrowRight size={18} aria-hidden /></span>
      </Link>
    </div>
  );
}
