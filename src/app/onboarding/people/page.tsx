import type { Metadata } from "next";
import { OnboardingPeople } from "@/components/onboarding/OnboardingPeople";

export const metadata: Metadata = { title: "Who is in your family’s cover?", robots: { index: false, follow: false } };

export default function Page() {
  return <OnboardingPeople />;
}
