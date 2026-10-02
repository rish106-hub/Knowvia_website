import type { SourceId } from "./sources";

// Launch guides. Every regulatory statement cites a primary source in `sources`.
// Worked examples use invented amounts and say so.

export type ArticleBlock =
  | { type: "p"; text: string; cite?: SourceId[] }
  | { type: "h2"; text: string }
  | { type: "ul"; items: string[]; cite?: SourceId[] }
  | { type: "ol"; items: string[] }
  | { type: "example"; title: string; lines: string[] }
  | { type: "limit"; text: string };

export interface Article {
  slug: string;
  title: string;
  description: string;
  audience: "family" | "team" | "both";
  directAnswer: string;
  publishedAt: string;
  updatedAt: string;
  author: string;
  reviewer: string | null;
  body: ArticleBlock[];
  sourceIds: SourceId[];
  related: { href: string; label: string }[];
}

const EDITORIAL = "Knowvia editorial team";

export const articles: Article[] = [
  {
    slug: "room-rent-limit",
    title: "What a room-rent limit changes",
    description:
      "A room-rent limit can reduce more than the room charge. Here is how proportionate deduction works and what to check in your own policy wording.",
    audience: "family",
    directAnswer:
      "If you choose a room that costs more than your policy's room-rent limit, some policies reduce other room-linked charges by the same proportion, not just the room charge. Which charges are reduced depends on how your policy wording defines them.",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    author: EDITORIAL,
    reviewer: null,
    body: [
      { type: "h2", text: "The limit is a ceiling on the room, and sometimes more" },
      {
        type: "p",
        text: "Many health policies cap the room charge they will pay each day, for example a fixed rupee amount or a share of the sum insured. If the room you occupy costs more than that cap, the extra room charge is yours to pay. Some policies go further and apply a proportionate deduction: charges that rise with the room category are paid only in the ratio of the limit to the room you chose.",
      },
      {
        type: "example",
        title: "Worked example with invented amounts",
        lines: [
          "Room-rent limit: ₹5,000 a day. Room chosen: ₹8,000 a day, for 4 days.",
          "Ratio applied: 5,000 ÷ 8,000 = 62.5%.",
          "Room-linked charges such as doctor and nursing fees: ₹1,20,000, so ₹75,000 is paid and ₹45,000 is not.",
          "Room charge above the limit: ₹3,000 × 4 = ₹12,000, also not paid.",
          "Medicines, implants and tests (₹60,000) are outside the deduction in this example.",
          "The family pays ₹57,000 of a ₹2,12,000 bill, even though the sum insured was not used up.",
        ],
      },
      { type: "h2", text: "What IRDAI said in 2020, and why your wording now matters most" },
      {
        type: "p",
        text: "In June 2020, IRDAI told insurers that policies applying proportionate deduction must define \"associated medical expenses\" in the policy, and that the cost of pharmacy and consumables, implants and medical devices, and diagnostics could not be part of that definition. It also said the deduction should not apply to ICU charges, or in hospitals that do not bill differently by room category.",
        cite: ["proportionateDeduction2020"],
      },
      {
        type: "p",
        text: "That 2020 circular is listed among the circulars superseded by IRDAI's Master Circular on Health Insurance Business of 29 May 2024. The 2024 circular requires every policy's Customer Information Sheet to list sub-limits and deductibles in one place. In practice, the definitions in your own policy wording and Customer Information Sheet are what an insurer will apply.",
        cite: ["masterCircular2024Annexures", "masterCircular2024"],
      },
      { type: "h2", text: "What to check in your policy" },
      {
        type: "ul",
        items: [
          "The room-rent limit itself: a rupee amount, a percentage of the sum insured, or a room category such as \"single private room\".",
          "Whether the wording mentions proportionate deduction, and how it defines the charges it applies to.",
          "Whether ICU charges have their own, separate limit.",
          "Whether a higher room is allowed if the eligible room is unavailable, and how the wording handles that case.",
        ],
      },
      {
        type: "limit",
        text: "This guide explains a general mechanism. It cannot tell you what your insurer will pay. Only your policy wording and the insurer's decision on a claim can do that.",
      },
    ],
    sourceIds: ["proportionateDeduction2020", "masterCircular2024", "masterCircular2024Annexures"],
    related: [
      { href: "/for-families", label: "See the room-rent example in the family walkthrough" },
      { href: "/blog/planned-hospital-admission", label: "What to prepare before a planned hospital admission" },
    ],
  },
  {
    slug: "employer-cover-after-leaving-a-job",
    title: "What happens to employer cover when you leave a job",
    description:
      "Group health cover is tied to the employer's policy. Here is what migration and portability allow, and what to arrange before your last day.",
    audience: "both",
    directAnswer:
      "Employer health cover is part of the employer's group policy, so it usually stops on the date its terms say membership ends. IRDAI's rules let members of group policies move accrued credits, such as waiting periods served, into another policy with the same insurer (migration), and let policyholders carry credits to another insurer (portability). Arrange this before your cover ends.",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    author: EDITORIAL,
    reviewer: null,
    body: [
      { type: "h2", text: "Why the cover does not simply continue" },
      {
        type: "p",
        text: "A group health policy is a contract between the insurer and the employer, who is the master policyholder. Employees and their dependants are members of that policy. When employment ends, the group policy's own terms decide when membership, and therefore cover, ends. Ask HR for the exact date in writing.",
      },
      { type: "h2", text: "Migration: moving to another policy with the same insurer" },
      {
        type: "p",
        text: "IRDAI's 2024 Master Circular says that when a policy is migrated to another policy with the same insurer, the policyholder, including all members under family cover and group insurance policies, can transfer credits gained in the previous policy: sum insured, no-claim bonus, specific waiting periods, the waiting period for pre-existing diseases and the moratorium period.",
        cite: ["masterCircular2024"],
      },
      { type: "h2", text: "Portability: moving to a different insurer" },
      {
        type: "p",
        text: "For indemnity policies, a policyholder can port to another insurer. The existing insurer must share the information the new insurer asks for within 72 hours, through the Insurance Information Bureau of India portal, and the new insurer must decide on the proposal within 5 days of receiving it. The same credits can be transferred.",
        cite: ["masterCircular2024", "iibPortal"],
      },
      {
        type: "p",
        text: "Credits gained under ported and migrated policies also count towards the 60-month moratorium period, after which a policy or claim cannot be contested for non-disclosure or misrepresentation except for established fraud.",
        cite: ["masterCircular2024"],
      },
      { type: "h2", text: "Before your last day" },
      {
        type: "ol",
        items: [
          "Ask HR for the date cover ends and whether dependants' cover ends on the same date.",
          "Ask the group insurer whether it offers a policy you can migrate to, and what it will cost.",
          "Collect your member ID, policy number and claim history. A new insurer will ask for them.",
          "If a family member is in treatment or has a planned admission, settle how it will be paid for before cover ends.",
        ],
      },
      {
        type: "limit",
        text: "Whether a migration or port is accepted, and on what premium, is the insurer's decision. Knowvia does not sell or recommend policies.",
      },
    ],
    sourceIds: ["masterCircular2024", "iibPortal"],
    related: [
      { href: "/for-employers", label: "How HR teams see leaver questions in Knowvia" },
      { href: "/blog/family-policy-access", label: "Who should be allowed to access a family policy" },
    ],
  },
  {
    slug: "super-top-up-deductible",
    title: "How a super top-up deductible interacts with base cover",
    description:
      "A super top-up pays only after a deductible is crossed. Here is how that threshold works alongside a base policy, with an example.",
    audience: "family",
    directAnswer:
      "A super top-up policy pays only after admissible expenses cross its deductible. Products sold as super top-ups usually count expenses across the policy year towards that deductible, while plain top-ups usually apply it to each claim. Your base policy can help cover the deductible, but check how the super top-up wording says the deductible is met.",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    author: EDITORIAL,
    reviewer: null,
    body: [
      { type: "h2", text: "What a deductible is" },
      {
        type: "p",
        text: "IRDAI's 2024 Master Circular describes a deductible, for the Customer Information Sheet, as a specified amount up to which an insurer will not pay any claim, or which will be deducted from the total claim if the claim is more than that amount. Every policy's Customer Information Sheet must list its deductibles.",
        cite: ["masterCircular2024"],
      },
      { type: "h2", text: "How a super top-up uses it" },
      {
        type: "p",
        text: "A super top-up is designed to sit above other cover. It starts paying once admissible expenses go past its deductible. The product wording decides whether the deductible applies to each hospitalisation or to the total for the year, and whether amounts paid by another policy count towards it. Read those clauses before relying on the combination.",
      },
      {
        type: "example",
        title: "Worked example with invented amounts",
        lines: [
          "Base family floater: ₹5,00,000. Super top-up: ₹20,00,000 with a ₹5,00,000 deductible counted across the policy year.",
          "First admission in the year: admissible bill ₹3,00,000. The base policy pays it. Running total: ₹3,00,000.",
          "Second admission: admissible bill ₹6,00,000. The base policy has ₹2,00,000 left and pays it. Running total reaches ₹5,00,000, so the deductible is crossed.",
          "The super top-up pays the remaining ₹4,00,000, if its wording counts both admissions towards the deductible.",
        ],
      },
      { type: "h2", text: "Claiming across two policies" },
      {
        type: "p",
        text: "For indemnity policies, IRDAI's 2024 Master Circular lets a policyholder choose which policy to claim under first. That insurer becomes the primary insurer. If its cover is less than the admissible amount, it must ask for details of the other policies and coordinate with those insurers to settle the balance as per their conditions.",
        cite: ["masterCircular2024"],
      },
      { type: "h2", text: "What to check" },
      {
        type: "ul",
        items: [
          "Is the deductible per claim or aggregate for the policy year?",
          "Does the deductible have to be paid by another policy, or can it be paid by you?",
          "Do the two policies' room-rent limits, sub-limits and waiting periods match?",
          "Who in the family is covered under each policy?",
        ],
      },
      {
        type: "limit",
        text: "The example simplifies how claims are assessed. Admissible amounts depend on each policy's terms and the insurer's decision.",
      },
    ],
    sourceIds: ["masterCircular2024"],
    related: [
      { href: "/how-it-works", label: "How Knowvia lines up several policies" },
      { href: "/blog/room-rent-limit", label: "What a room-rent limit changes" },
    ],
  },
  {
    slug: "cashless-vs-reimbursement",
    title: "Cashless versus reimbursement claims",
    description:
      "Cashless means the insurer settles with a network hospital. Reimbursement means you pay first and claim later. Here is what the 2024 rules say about each.",
    audience: "both",
    directAnswer:
      "In a cashless claim, the insurer authorises treatment at a network hospital and settles the bill with the hospital directly. In a reimbursement claim, you pay the hospital and then claim from the insurer. IRDAI's 2024 Master Circular requires insurers to decide on a cashless request within one hour and to give final discharge authorisation within three hours of the hospital's request.",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    author: EDITORIAL,
    reviewer: null,
    body: [
      { type: "h2", text: "Where cashless is available" },
      {
        type: "p",
        text: "Insurers must publish the hospitals they have tie-ups with for cashless settlement, and state that treatment at other hospitals has to be claimed as reimbursement. Check that list on your insurer's website before a planned admission.",
        cite: ["masterCircular2024"],
      },
      { type: "h2", text: "Timelines for cashless" },
      {
        type: "ul",
        items: [
          "The insurer must decide on a cashless authorisation request immediately, and in not more than one hour of receiving it.",
          "Insurers must also offer pre-authorisation to the policyholder digitally.",
          "Final authorisation for discharge must be given within three hours of the hospital's request. If there is a delay beyond three hours, any additional amount the hospital charges is borne by the insurer from its shareholders' fund.",
        ],
        cite: ["masterCircular2024"],
      },
      { type: "h2", text: "Documents and decisions" },
      {
        type: "p",
        text: "After a claim is intimated, insurers and third-party administrators are to collect the required documents from the hospital; the circular says the policyholder shall not be required to submit them. No claim may be rejected without approval from the insurer's Product Management Committee or its Claims Review Committee, and a rejection or partial payment must be explained with reference to the specific policy terms.",
        cite: ["masterCircular2024"],
      },
      { type: "h2", text: "When reimbursement is likely" },
      {
        type: "ul",
        items: [
          "Treatment at a hospital outside the insurer's cashless network.",
          "An emergency where there was no time to arrange authorisation.",
          "A cashless request that was not approved in full.",
        ],
      },
      {
        type: "p",
        text: "For reimbursement, keep every bill, discharge summary, prescription and test report, and note the insurer's claim timelines in your policy wording.",
      },
      {
        type: "limit",
        text: "These are regulatory requirements on insurers. Whether a particular claim is payable depends on the policy terms and the insurer's assessment.",
      },
    ],
    sourceIds: ["masterCircular2024"],
    related: [
      { href: "/blog/planned-hospital-admission", label: "What to prepare before a planned hospital admission" },
      { href: "/how-it-works", label: "How Knowvia marks what is known and unknown" },
    ],
  },
  {
    slug: "family-policy-access",
    title: "Who should be allowed to access a family policy",
    description:
      "Policy documents carry health and identity details. Here is how to decide who in the family can see them and act on them, with the consent rules that apply.",
    audience: "family",
    directAnswer:
      "Give access only to the people who need to act: usually the policyholder, one backup adult and, for a parent's policy, the adult child who handles admissions. Agree it openly, record the nominee with the insurer, and remember that personal data should be shared with consent that can later be withdrawn.",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    author: EDITORIAL,
    reviewer: null,
    body: [
      { type: "h2", text: "Why access needs a decision" },
      {
        type: "p",
        text: "A policy, its e-cards and its claim papers can reveal illnesses, treatments and identity numbers. In an emergency, though, the person at the hospital may not be the policyholder. Deciding in advance who can see and use these papers avoids both oversharing and a scramble.",
      },
      { type: "h2", text: "Consent is the starting point" },
      {
        type: "p",
        text: "India's Digital Personal Data Protection Act, 2023 requires consent for processing personal data to be free, specific, informed, unconditional and unambiguous, given by a clear affirmative action, and it lets a person withdraw consent later. Families are not regulated businesses, but the same habits help: ask before sharing a relative's records, share only what is needed, and stop when asked.",
        cite: ["dpdpAct2023"],
      },
      {
        type: "p",
        text: "IRDAI's 2024 Master Circular takes the same approach for health records held through an ABHA number: an insurer must obtain the policyholder's express consent each time medical records are shared.",
        cite: ["masterCircular2024"],
      },
      { type: "h2", text: "Nominee is not the same as access" },
      {
        type: "p",
        text: "The nominee is the person who receives claim proceeds if the policyholder dies. The policyholder can change the nomination at any time during the policy term. A nominee does not automatically get the right to see the policy or speak for the policyholder while they are alive.",
        cite: ["masterCircular2024"],
      },
      { type: "h2", text: "A simple family arrangement" },
      {
        type: "ol",
        items: [
          "List each policy, its holder and who it covers.",
          "Name one primary and one backup person who can act during an admission.",
          "Ask each insurer how it records an authorised contact, and do it while everyone is well.",
          "Keep e-cards and helpline numbers where both people can reach them.",
          "Review the arrangement at every renewal or change in the household.",
        ],
      },
      {
        type: "limit",
        text: "This is general information, not legal advice. Insurers have their own processes for authorising someone to act for a policyholder.",
      },
    ],
    sourceIds: ["dpdpAct2023", "masterCircular2024"],
    related: [
      { href: "/trust", label: "How Knowvia handles household access" },
      { href: "/for-families", label: "See a household example" },
    ],
  },
  {
    slug: "planned-hospital-admission",
    title: "What to prepare before a planned hospital admission",
    description:
      "A planned admission gives you time to check cover, arrange cashless approval and avoid surprises at discharge. Here is a practical checklist.",
    audience: "family",
    directAnswer:
      "Before a planned admission, confirm the hospital is in your insurer's cashless network, read the room-rent limit, sub-limits and waiting periods in your Customer Information Sheet, request pre-authorisation, and decide which policy you will claim under first if you have more than one.",
    publishedAt: "2026-10-02",
    updatedAt: "2026-10-02",
    author: EDITORIAL,
    reviewer: null,
    body: [
      { type: "h2", text: "One to two weeks before" },
      {
        type: "ol",
        items: [
          "Check the hospital is on your insurer's published cashless list. If it is not, plan for a reimbursement claim.",
          "Read your Customer Information Sheet. It must list the sum insured, coverage, exclusions, sub-limits, deductibles and waiting periods in one place.",
          "Ask the hospital for a written cost estimate by room category, and compare it with your room-rent limit.",
          "If you have more than one policy, choose which to claim under first. For indemnity policies, that insurer becomes the primary insurer and coordinates with the others for any balance.",
        ],
      },
      {
        type: "p",
        text: "These points come from the obligations IRDAI's 2024 Master Circular places on insurers: publishing cashless network lists, providing a Customer Information Sheet with every policy, and coordinating claims across multiple indemnity policies.",
        cite: ["masterCircular2024"],
      },
      { type: "h2", text: "A few days before" },
      {
        type: "ul",
        items: [
          "Ask the hospital's insurance desk to send the pre-authorisation request, or request it digitally yourself. Insurers must decide on cashless requests within one hour of receiving them.",
          "Keep the policy number, e-card, photo ID and the doctor's admission note together.",
          "Write down anything that is still unclear, such as a sub-limit that the schedule and wording state differently, and ask the insurer to confirm it in writing.",
        ],
        cite: ["masterCircular2024"],
      },
      { type: "h2", text: "At discharge" },
      {
        type: "p",
        text: "Insurers must give final discharge authorisation within three hours of the hospital's request, and the circular says a policyholder should not be made to wait to be discharged. If you are asked to pay part of the bill, ask for the reason with reference to the policy terms.",
        cite: ["masterCircular2024"],
      },
      {
        type: "limit",
        text: "Preparation reduces surprises but cannot guarantee approval. The insurer decides what is payable under your policy.",
      },
    ],
    sourceIds: ["masterCircular2024"],
    related: [
      { href: "/blog/cashless-vs-reimbursement", label: "Cashless versus reimbursement claims" },
      { href: "/blog/room-rent-limit", label: "What a room-rent limit changes" },
    ],
  },
];

export function getArticle(slug: string): Article | undefined {
  return articles.find((article) => article.slug === slug);
}
