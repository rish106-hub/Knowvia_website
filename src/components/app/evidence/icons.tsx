// Small inline icons for the evidence states. Each state also differs by border shape and by words, never colour alone.
import type { StateKind } from "@/lib/app-evidence";

type P = { size?: number };
const base = (size: number) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true, focusable: false });

export const CheckIcon = ({ size = 16 }: P) => (
  <svg {...base(size)} strokeWidth={2.4}>
    <polyline points="5 12.5 10 17 19 7" />
  </svg>
);
export const QuestionIcon = ({ size = 16 }: P) => (
  <svg {...base(size)} strokeWidth={2.2}>
    <circle cx="12" cy="12" r="9" />
    <path d="M9.6 9.4a2.5 2.5 0 1 1 3.4 2.3c-0.7 0.3-1 0.8-1 1.5v0.4" />
    <circle cx="12" cy="17" r="0.6" fill="currentColor" />
  </svg>
);
export const AlertIcon = ({ size = 16 }: P) => (
  <svg {...base(size)} strokeWidth={2.4}>
    <path d="M12 3.5 21.5 20h-19z" />
    <path d="M12 10v4.5" />
    <circle cx="12" cy="17.2" r="0.6" fill="currentColor" />
  </svg>
);
export const ClockIcon = ({ size = 16 }: P) => (
  <svg {...base(size)} strokeWidth={2.2}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);
export const PageIcon = ({ size = 16 }: P) => (
  <svg {...base(size)} strokeWidth={2.2}>
    <path d="M6 3.5h8l4 4V20.5H6z" />
    <path d="M14 3.5v4h4" />
    <path d="M9 12.5h6M9 16h6" />
  </svg>
);
export const PersonCheckIcon = ({ size = 16 }: P) => (
  <svg {...base(size)} strokeWidth={2.2}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3.5 19.5c0-3.2 2.4-5.2 5.5-5.2 1.2 0 2.2 0.3 3.1 0.8" />
    <polyline points="14.5 17 16.8 19.3 21 14.8" />
  </svg>
);
export const ArrowIcon = ({ size = 16 }: P) => (
  <svg {...base(size)} strokeWidth={2.2}>
    <path d="M5 12h14" />
    <path d="M13 6l6 6-6 6" />
  </svg>
);

export function StateIcon({ kind, size = 16 }: { kind: StateKind; size?: number }) {
  switch (kind) {
    case "known":
      return <CheckIcon size={size} />;
    case "confirmed_by_you":
      return <PersonCheckIcon size={size} />;
    case "from_document":
      return <PageIcon size={size} />;
    case "conflicting":
      return <AlertIcon size={size} />;
    case "not_checked":
      return <ClockIcon size={size} />;
    case "not_confirmed":
      return <QuestionIcon size={size} />;
  }
}
