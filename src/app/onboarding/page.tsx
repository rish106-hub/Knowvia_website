import type { Metadata } from "next";
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow";

export const metadata: Metadata = { title: "Add your health cover", description: "See how Knowvia reads your family’s health policies." };
export default function OnboardingPage() { return <OnboardingFlow />; }
