"use client";

import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { appFetch, newIdempotencyKey } from "@/lib/app-client";
import type { ConsentView, Overview } from "@/lib/app-contract";
import { ConsentNoticeCard } from "../consent/ConsentNoticeCard";
import { useConsentNotices } from "../consent/useConsentNotices";
import { DOCUMENTS_HREF, holdsKeepConsent } from "../dashboard/view-model";
import { caseIdOf } from "../shell/overview-utils";
import { errorCopy } from "../shell/error-copy";
import { RequireSession } from "../shell/RequireSession";
import { asApiError, useApp } from "../shell/session-context";
import { Button, ButtonLink, Notice } from "../ui";

/** DRAFT, FOR LEGAL REVIEW. One sentence on what this single permission does, and what it does not. */
export const KEEP_LEAD =
  "Allow CoverSaath to keep the PDFs you add, so they are there when you come back. This does not let CoverSaath read them: reading is asked separately, once, after you have added your documents.";
export const KEEP_TAKE_BACK = "You can take this back at any time on the Permissions page. After that, you cannot open or read the PDFs you added until you allow it again.";

/** S04 for a signed-in session only. */
export function KeepConsentScreen() {
  return <RequireSession>{(overview) => <KeepConsent overview={overview} />}</RequireSession>;
}

/**
 * S04: keep my document. The first of the two consent moments, shown before the first upload for a new person. It uses the same
 * notice card as the reading consent (S08), with the wording from GET /consents/notices (scope "collect"), and gives exactly
 * the permission the Documents screen would otherwise ask for inline: set up the case if needed, then POST /consents. The
 * Documents screen is unchanged and still asks by itself if this screen is skipped. DRAFT wording, for legal review.
 */
function KeepConsent({ overview }: { overview: Overview }) {
  const { reloadOverview, handleError } = useApp();
  const router = useRouter();
  const held = holdsKeepConsent(overview.consents);
  const notices = useConsentNotices(!held);
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState<ReturnType<typeof errorCopy> | null>(null);
  // One key for this screen's attempt, so pressing "Try again" replays instead of creating a second permission.
  const keyRef = useRef<string | null>(null);
  const caseRef = useRef<string | undefined>(undefined);
  const running = useRef(false);

  async function allow() {
    if (running.current) return;
    running.current = true;
    setBusy(true);
    setFailure(null);
    try {
      let activeCase = caseIdOf(overview) ?? caseRef.current;
      if (!activeCase) {
        activeCase = (await appFetch<{ caseId: string }>("/cases", { method: "POST", json: {} })).caseId;
        caseRef.current = activeCase;
      }
      keyRef.current ??= newIdempotencyKey();
      await appFetch<{ consent: ConsentView }>("/consents", { method: "POST", json: { scope: "collect" }, headers: { "Idempotency-Key": keyRef.current } });
      await reloadOverview();
      router.push(DOCUMENTS_HREF);
    } catch (caught) {
      if (!handleError(caught)) setFailure(errorCopy(asApiError(caught)));
    } finally {
      running.current = false;
      setBusy(false);
    }
  }

  if (held) {
    return (
      <div className="kva-stack kva-stack--lg">
        <h1 className="kva-h1">Keep my documents</h1>
        <Notice tone="success" title="You have already allowed this" live="off">
          CoverSaath keeps the PDFs you add. You can take that back at any time on the Permissions page.
        </Notice>
        <div>
          <ButtonLink href={DOCUMENTS_HREF} icon={<ArrowRight size={20} weight="bold" aria-hidden="true" />}>
            Add documents
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="kva-stack kva-stack--lg" data-screen="keep-consent">
      <div className="kva-stack">
        <h1 className="kva-h1">Keep my documents</h1>
        <p className="kva-lead">The first of two questions. Nothing is stored until you say yes.</p>
      </div>

      <div className="kva-card">
        <ConsentNoticeCard scope="collect" lead={KEEP_LEAD} notices={notices} />
        <p className="kva-p kva-small kva-muted">{KEEP_TAKE_BACK}</p>
      </div>

      {failure ? (
        <Notice tone="error" title={failure.title} actions={<Button size="sm" onClick={() => void allow()}>Try again</Button>}>
          {failure.message}
        </Notice>
      ) : null}

      <div className="kva-row">
        <Button busy={busy} disabled={notices.state.status !== "ready"} onClick={() => void allow()} icon={<ArrowRight size={20} weight="bold" aria-hidden="true" />}>
          Allow and add documents
        </Button>
        <Link href="/app" className="kva-btn kva-btn--secondary">
          Not now
        </Link>
      </div>
    </div>
  );
}
