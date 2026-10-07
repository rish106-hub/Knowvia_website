// Synthetic demonstration data. Every name, policy and number here is invented for illustration.
// No real household, employer, insurer or person is represented.

export type FactStatus = "known" | "unknown" | "gap" | "next";

export interface DemoFact {
  status: FactStatus;
  label: string;
  detail: string;
  source?: string;
}

export const familyDemo = {
  householdName: "The Rao household",
  members: ["Anil, 52", "Meera, 49", "Kavya, 21", "Lakshmi (Anil's mother), 76"],
  policies: [
    {
      name: "Work health cover",
      holder: "Anil",
      sumInsured: "₹5,00,000",
      covers: "Anil, Meera, Kavya",
      note: "May end if Anil leaves the job. Ask how to keep it.",
    },
    {
      name: "Family floater",
      holder: "Meera",
      sumInsured: "₹10,00,000",
      covers: "Anil, Meera, Kavya",
      note: "Room rent limited to ₹5,000 a day in the wording.",
    },
    {
      name: "Senior health plan",
      holder: "Lakshmi",
      sumInsured: "₹3,00,000",
      covers: "Lakshmi",
      note: "Lakshmi pays 20% of each approved bill.",
    },
  ],
  facts: [
    {
      status: "known",
      label: "Room rent limit on the floater",
      detail: "₹5,000 a day for a single private room.",
      source: "Floater wording, page 14",
    },
    {
      status: "known",
      label: "Lakshmi's share",
      detail: "She pays 20% of each approved bill.",
      source: "Plan summary, page 2",
    },
    {
      status: "gap",
      label: "Lakshmi is not on the group cover",
      detail: "Parents were not added at enrolment. Her only cover is ₹3,00,000, and she pays 20% herself.",
      source: "Group enrolment list",
    },
    {
      status: "unknown",
      label: "Cataract limit on the senior plan",
      detail: "The schedule and the wording state different amounts. Only the insurer can confirm which applies.",
      source: "Schedule page 2 and wording page 21 disagree",
    },
    {
      status: "next",
      label: "Ask the insurer to confirm the cataract limit in writing",
      detail: "Before booking Lakshmi's planned surgery. Keep the reply with the policy.",
    },
  ] satisfies DemoFact[],
  nextSteps: [
    { owner: "Meera", action: "Send the cataract limit question to the senior policy's insurer", due: "This week" },
    { owner: "Anil", action: "Check whether the group cover can add parents at the next enrolment window", due: "Before renewal" },
    { owner: "Kavya", action: "Save the family floater's e-card and the cashless helpline in her phone", due: "Today" },
  ],
} as const;

export const teamDemo = {
  companyName: "Harbourline Logistics",
  headcount: 240,
  enrolment: [
    { label: "Employees enrolled", value: 228, of: 240, status: "known" },
    { label: "Dependant details pending", value: 9, of: 240, status: "unknown" },
    { label: "New joiners without an e-card", value: 3, of: 240, status: "gap" },
  ],
  questions: [
    { topic: "Adding parents mid-year", count: 14, answer: "The group policy allows additions only at enrolment and for new joiners." },
    { topic: "Room limits", count: 11, answer: "A single private room up to 1% of the cover amount each day, shown on the plan summary." },
    { topic: "Cover after resignation", count: 6, answer: "Cover stops on the exit date. Migration options depend on the insurer." },
    { topic: "Maternity waiting period", count: 4, answer: "Unknown for this policy year. The broker has been asked to confirm." },
  ],
  handoffs: [
    { owner: "HR operations", action: "Collect dependant details from 9 employees before the insurer's cut-off", status: "next" },
    { owner: "Broker", action: "Confirm the maternity waiting period for this policy year in writing", status: "unknown" },
    { owner: "HR operations", action: "Issue e-cards to 3 new joiners and send the cashless steps", status: "next" },
  ],
} as const;
