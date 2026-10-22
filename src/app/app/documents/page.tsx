import type { Metadata } from "next";
import { DocumentsScreen } from "@/components/app/documents/DocumentsScreen";

export const metadata: Metadata = { title: "Documents" };

export default function DocumentsPage() {
  return <DocumentsScreen />;
}
