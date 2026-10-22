"use client";

import { PencilSimpleLine } from "@phosphor-icons/react";

export const DRAFT_MARK_TEXT = "Draft wording, pending legal review";

/** Marks wording that has not been through legal review. Shown next to every consent notice. */
export function DraftMark() {
  return (
    <span className="kva-draft" data-draft-mark>
      <PencilSimpleLine size={16} weight="bold" aria-hidden="true" />
      {DRAFT_MARK_TEXT}
    </span>
  );
}
