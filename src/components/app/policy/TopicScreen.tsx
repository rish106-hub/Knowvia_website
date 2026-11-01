"use client";

import type { DashboardTopic } from "@/lib/app-contract";
import { RequireSession } from "../shell/RequireSession";
import { TopicDetail } from "./TopicDetail";

/** S12 for a signed-in session only. The page has already checked the topic is one of the six. */
export function TopicScreen({ topic }: { topic: DashboardTopic }) {
  return <RequireSession>{(overview) => <TopicDetail overview={overview} topic={topic} />}</RequireSession>;
}
