import type { Metadata } from "next";
import { EntryModeTiles } from "@/components/app/start/EntryModeTiles";

export const metadata: Metadata = { title: "Start" };

export default function StartPage() {
  return <EntryModeTiles />;
}
