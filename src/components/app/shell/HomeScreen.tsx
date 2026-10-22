"use client";

import { ArrowRight, UserCircle } from "@phosphor-icons/react";
import type { Overview } from "@/lib/app-contract";
import { PermissionsPanel } from "../consent/PermissionsPanel";
import { PermissionWithdrawnNotice } from "../documents/PermissionWithdrawnNotice";
import { ButtonLink, StatusBadge } from "../ui";
import { RequireSession } from "./RequireSession";

export function HomeScreen() {
  return <RequireSession>{(overview) => <HomeInner overview={overview} />}</RequireSession>;
}

function HomeInner({ overview }: { overview: Overview }) {
  const live = overview.documents.filter((doc) => doc.stage !== "deleted");
  return (
    <>
      <div className="kva-stack">
        <h1 className="kva-h1">Your household</h1>
        <p className="kva-lead">Add your policy PDFs and see where each one stands.</p>
      </div>

      <section className="kva-section" aria-labelledby="kva-people-h">
        <h2 className="kva-h2" id="kva-people-h">
          People
        </h2>
        <ul className="kva-list" data-testid="people">
          {overview.members.map((member) => {
            const isOwner = member.id === overview.owner.memberId;
            return (
              <li className="kva-item kva-item--wrap" key={member.id}>
                <UserCircle size={28} aria-hidden="true" />
                <div className="kva-item__text">
                  <span className="kva-item__name">{member.displayName}</span>
                  <span className="kva-small kva-muted">
                    {[isOwner ? "You, account owner" : member.relationshipLabel || member.memberKind || "", `Policies: ${member.policiesFound}`].filter(Boolean).join(" · ")}
                  </span>
                </div>
                {isOwner ? <StatusBadge tone="neutral" icon={<UserCircle size={18} weight="bold" aria-hidden="true" />}>Owner</StatusBadge> : null}
              </li>
            );
          })}
        </ul>
        <p className="kva-p kva-small kva-muted">Only you are here for now. Adding family members and sharing are not available yet.</p>
      </section>

      <section className="kva-section" aria-labelledby="kva-home-docs-h">
        <h2 className="kva-h2" id="kva-home-docs-h">
          Documents
        </h2>
        <PermissionWithdrawnNotice overview={overview} />
        <p className="kva-p">{live.length === 0 ? "You have not added a document yet." : `${live.length} ${live.length === 1 ? "document" : "documents"} added.`}</p>
        <div>
          <ButtonLink href="/app/documents" icon={<ArrowRight size={20} weight="bold" aria-hidden="true" />}>
            {live.length === 0 ? "Add a PDF" : "Go to documents"}
          </ButtonLink>
        </div>
      </section>

      <PermissionsPanel overview={overview} />
    </>
  );
}
