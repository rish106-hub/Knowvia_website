import type { ElementType, ReactNode } from "react";

/** Text for assistive technology only. */
export function VisuallyHidden({ children, as: Tag = "span" }: { children: ReactNode; as?: ElementType }) {
  return <Tag className="kva-sr">{children}</Tag>;
}
