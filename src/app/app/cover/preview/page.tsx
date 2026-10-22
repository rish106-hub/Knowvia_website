import type { Metadata } from "next";
import { PreviewScreen } from "@/components/app/preview";

export const metadata: Metadata = { title: "What this means for you" };

export default function PreviewPage() {
  return <PreviewScreen />;
}
