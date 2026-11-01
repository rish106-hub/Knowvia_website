"use client";

import { DashboardScreen } from "../dashboard/DashboardScreen";
import type { EntryMode } from "../dashboard/view-model";
import { RequireSession } from "./RequireSession";

/**
 * /app: the dashboard (S11), for a signed-in session only. `mode` is the entry mode: E (care needed now) opens it with the
 * emergency card on top.
 */
export function HomeScreen({ mode = "P" }: { mode?: EntryMode }) {
  return <RequireSession>{(overview) => <DashboardScreen overview={overview} mode={mode} />}</RequireSession>;
}
