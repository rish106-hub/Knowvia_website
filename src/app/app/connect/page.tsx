import type { Metadata } from "next";
import { ConnectScreen } from "@/components/app/blocks/ConnectScreen";

export const metadata: Metadata = { title: "Add a document" };

export default function ConnectPage() {
  return <ConnectScreen />;
}
