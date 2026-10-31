// The pure parts of starting reading by itself (used by useAutoStartReading). Unit tested in tests/unit/app-ui.
/**
 * Which documents to start now. `readyIds` are the documents whose reading can start (see documentsReadyToStartReading:
 * accepted, permission held, nextAction start_ocr, no job). Each is started once: ids already `tried` are skipped, and
 * ids that are no longer ready are forgotten so a document can be started again after its permission was withdrawn and
 * given again.
 */
export function planAutoStart(readyIds: readonly string[], tried: ReadonlySet<string>): { start: string[]; tried: Set<string> } {
  const ready = [...new Set(readyIds)].sort();
  const kept = new Set([...tried].filter((id) => ready.includes(id)));
  const start = ready.filter((id) => !kept.has(id));
  for (const id of start) kept.add(id);
  return { start, tried: kept };
}

/**
 * Runs tasks strictly one after another, whatever order they are added in. The BFF keeps its job list in a cookie that
 * every response rewrites, so two start requests in flight would lose one of the jobs.
 */
export function createSerialQueue() {
  let tail: Promise<void> = Promise.resolve();
  return (task: () => Promise<void>): Promise<void> => {
    tail = tail.then(task).catch(() => undefined);
    return tail;
  };
}
