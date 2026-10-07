import Image from "next/image";
import { supportMarks } from "@/content/evidence";
import styles from "./SupportStrip.module.css";

function MarkList({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className={styles.group} aria-hidden={hidden || undefined}>
      {supportMarks.map((mark) => (
        <li key={mark.name} className={styles.logo} data-mark={mark.name}>
          <div className={styles.float}>
            <Image
              src={mark.file}
              alt={hidden ? "" : mark.name}
              width={mark.width}
              height={mark.height}
              sizes="(max-width: 680px) 180px, 230px"
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function SupportStrip() {
  return (
    <section className={styles.section} aria-labelledby="support-label">
      <div className={`wrap ${styles.inner}`}>
        <h2 id="support-label" className={styles.label}>
          With support from
        </h2>
        <div className={styles.viewport}>
          <div className={styles.track}>
            <MarkList />
            <MarkList hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
