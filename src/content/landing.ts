export const policyTerms = ["Room rent limit", "Co-pay", "Waiting period", "Sub-limit", "Deductible", "Network hospital", "Pre-existing disease", "Cashless claim", "Portability", "Restoration benefit", "No-claim bonus", "Day-care procedure"];

export const industryStats = [
  { value: "44%", body: "of people who claimed on health insurance say it was rejected or only partly paid, for reasons they found invalid.", source: "LocalCircles national survey, claims made 2023 to 2025: 18,989 responses. Published 7 March 2026.", tone: "lime" },
  { value: "₹26,037 cr", body: "of health insurance claims were rejected or disallowed by insurers in a single year, 2023-24.", source: "Minister of State for Finance, reply in the Lok Sabha, using data shared by IRDAI. Reported 7 February 2025.", tone: "soft" },
  { value: "48 hours", body: "is the longest wait families reported. Five in ten claimants waited 6 to 48 hours for approval and discharge.", source: "LocalCircles survey, 18,119 responses, citing the IRDAI three-hour discharge rule.", tone: "mint" },
  { value: "₹43 of ₹100", body: "spent on health in India comes straight out of people's own pockets.", source: "National Health Accounts 2022-23, Ministry of Health and Family Welfare.", tone: "gold" },
];

export const familyStories = [
  { value: "₹80,000", body: "A ₹1,200 room choice, made with no information, cost one family ₹80,000.", kind: "bars" },
  { value: "₹2,00,000", body: "A gap neither policy would pay. She found it before paying ₹9,400 for the top-up.", kind: "cover" },
  { value: "7 hours", body: "Spent at the hospital finding a brother's employer cover.", kind: "timeline" },
  { value: "17 days", body: "The window to keep cover after leaving a job. No reminder came. It closed.", kind: "days" },
];

export const faqs = [
  ["When can I use it, and what will it cost?", "Knowvia is not open yet, and pricing is not set. Join the early list and you will hear about both first."],
  ["Is this only for health insurance?", "Yes. The current product is built only for health insurance."],
  ["Is Knowvia an insurance company?", "No. Knowvia is not an insurer, broker, TPA, or hospital desk."],
  ["Will you sell me a policy?", "No. Knowvia reads the policies you already have and helps you see the questions that remain."],
  ["Can Knowvia tell me if a claim will be approved?", "No. Only your insurer can decide a claim. Knowvia shows the clauses that may matter and what is still unclear."],
  ["What should I do in an emergency?", "Contact the hospital and insurer first. Knowvia is not an emergency service."],
  ["Does it work with my employer's group health policy?", "That is part of the plan. Employer cover can sit beside personal and family policies."],
  ["Do I need all my documents to start?", "No. Start with what you have. Missing documents and unanswered questions stay clearly marked."],
  ["How is my data kept safe?", "Access is controlled person by person. Medical details are private by default."],
  ["Who can see my family's information?", "Each adult decides what to share. Cover and policy details can be shared without exposing medical information."],
] as const;

export const promises = [
  ["Promise a claim", "Only your insurer decides a claim. We show which clauses apply and what is still open."],
  ["Guess", "A fact we cannot find stays marked Not confirmed until someone who knows confirms it."],
  ["Push a policy", "Sometimes the right answer is to buy nothing yet. We will say so."],
  ["Show medical details", "Not to anyone, unless that person chose to share them."],
  ["Replace your insurer", "We help you ask insurers, TPAs, and hospital desks better questions."],
] as const;
