import type { Metadata } from "next";
import { OnboardingStart } from "@/components/onboarding/OnboardingStart";

export const metadata: Metadata = { title: "Start with your own cover | Onboarding preview", robots: { index: false, follow: false } };

export default function Page() {
  return <OnboardingStart />;
}
