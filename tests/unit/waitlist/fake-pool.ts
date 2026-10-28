type Result = { rows: unknown[]; rowCount: number | null };
type Responder = (text: string, values: unknown[] | undefined) => Result | Promise<Result>;

/** In-memory stand-in for pg.Pool that records every statement. Synthetic data only. */
export function fakePool(responder: Responder = () => ({ rows: [{ id: 1 }], rowCount: 1 })) {
  const calls: { text: string; values?: unknown[] }[] = [];
  const query = async (text: string, values?: unknown[]) => {
    calls.push({ text, values });
    return responder(text, values);
  };
  let released = 0;
  return {
    calls,
    get released() {
      return released;
    },
    query,
    connect: async () => ({ query, release: () => void (released += 1) }),
  };
}
