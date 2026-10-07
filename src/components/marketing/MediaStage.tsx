import styles from "./MediaStage.module.css";

export function MediaStage({ children }: { children: React.ReactNode }) {
  return <div className={styles.stage}>{children}</div>;
}
