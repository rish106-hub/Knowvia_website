import type { Metadata } from "next";
import { EmergencyScreen } from "@/components/app/emergency/EmergencyScreen";

export const metadata: Metadata = { title: "Someone needs care now" };

export default function EmergencyPage() {
  return <EmergencyScreen />;
}
