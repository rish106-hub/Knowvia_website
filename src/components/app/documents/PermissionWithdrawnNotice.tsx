"use client";

import type { Overview } from "@/lib/app-contract";
import { Notice } from "../ui";

/** Shown when the storage permission was withdrawn: the list is then the deletion inventory, not a full read. DRAFT copy. */
export function PermissionWithdrawnNotice({ overview }: { overview: Overview }) {
  if (overview.documentsAccess !== "permission_withdrawn") return null;
  return (
    <Notice tone="warning" title="You withdrew permission to store your PDFs" live="off">
      Documents still held are shown so you can delete them. You cannot open or read them until you allow storing again. Adding a PDF asks for that permission again.
    </Notice>
  );
}
