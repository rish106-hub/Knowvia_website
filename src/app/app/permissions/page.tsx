import type { Metadata } from "next";
import { PermissionsScreen } from "@/components/app/consent/PermissionsPanel";

export const metadata: Metadata = { title: "What you have shared" };

export default function PermissionsPage() {
  return <PermissionsScreen />;
}
