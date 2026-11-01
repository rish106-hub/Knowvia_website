import type { Metadata } from "next";
import { ReadyScreen } from "@/components/app/ready/ReadyChecklist";

export const metadata: Metadata = { title: "Get ready for a hospital visit" };

export default function ReadyPage() {
  return <ReadyScreen />;
}
