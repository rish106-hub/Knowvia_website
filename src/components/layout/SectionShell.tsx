import styles from "./SectionShell.module.css";

interface SectionShellProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  labelledBy?: string;
  compact?: boolean;
}

export function SectionShell({ children, className = "", id, labelledBy, compact = false }: SectionShellProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`${styles.section} ${compact ? styles.compact : ""} ${className}`}
    >
      <div className={`wrap ${styles.inner}`}>{children}</div>
    </section>
  );
}
