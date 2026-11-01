import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isTopicId } from "@/components/app/dashboard/view-model";
import { TopicScreen } from "@/components/app/policy/TopicScreen";

export const metadata: Metadata = { title: "What your documents say" };

// Only the six topics exist. Any other value is a 404.
export default async function PolicyTopicPage({ params }: { params: Promise<{ topic: string }> }) {
  const { topic } = await params;
  if (!isTopicId(topic)) notFound();
  return <TopicScreen topic={topic} />;
}
