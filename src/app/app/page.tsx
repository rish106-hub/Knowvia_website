import type { Metadata } from "next";
import { HomeScreen } from "@/components/app/shell/HomeScreen";

export const metadata: Metadata = { title: "Home" };

export default function AppHomePage() {
  return <HomeScreen />;
}
