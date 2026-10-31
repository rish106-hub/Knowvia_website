"use client";

import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  Buildings,
  Camera,
  ChatCircleText,
  CheckCircle,
  Clock,
  EnvelopeSimple,
  HourglassMedium,
  IdentificationCard,
  Microphone,
  Tray,
  UploadSimple,
} from "@phosphor-icons/react";
import type { ReactNode } from "react";
import type { ConnectorView } from "@/lib/app-contract";
import css from "./blocks.module.css";
import { blockFor, CONNECTOR_CHIPS, connectHref, type ConnectorIcon } from "./registry";

export function ConnectorIconView({ icon, size }: { icon: ConnectorIcon; size: number }) {
  const props = { size, weight: "regular" as const, "aria-hidden": true as const };
  switch (icon) {
    case "upload":
      return <UploadSimple {...props} />;
    case "camera":
      return <Camera {...props} />;
    case "mail":
      return <EnvelopeSimple {...props} />;
    case "inbox":
      return <Tray {...props} />;
    case "building":
      return <Buildings {...props} />;
    case "briefcase":
      return <Briefcase {...props} />;
    case "identification":
      return <IdentificationCard {...props} />;
    case "chat":
      return <ChatCircleText {...props} />;
    case "microphone":
      return <Microphone {...props} />;
  }
}

/** "Works now", "Soon" or "Later": word, icon, border shape and colour together. */
export function AvailabilityChip({ availability }: { availability: ConnectorView["availability"] }): ReactNode {
  const className = availability === "available" ? css.chipNow : availability === "stub" ? css.chipSoon : css.chipLater;
  const Icon = availability === "available" ? CheckCircle : availability === "stub" ? Clock : HourglassMedium;
  return (
    <span className={`${css.chip} ${className}`}>
      <Icon size={14} weight="bold" aria-hidden="true" />
      {CONNECTOR_CHIPS[availability]}
    </span>
  );
}

/** One connector: the big upload block, or a row in a list. Both are plain links, so they work without script. */
export function ConnectorCard({ connector, variant }: { connector: ConnectorView; variant: "primary" | "row" }) {
  const block = blockFor(connector);
  if (variant === "primary") {
    return (
      <Link href={connectHref(connector)} className={css.primary} data-testid={`connector-${connector.id}`}>
        <ConnectorIconView icon={block.icon} size={34} />
        <span className={css.primaryText}>
          <span className={css.primaryTitle}>{block.title}</span>
          <span className={css.primaryHint}>{block.blurb}</span>
        </span>
        <AvailabilityChip availability={connector.availability} />
        <ArrowRight size={20} weight="regular" aria-hidden="true" />
      </Link>
    );
  }
  return (
    <Link href={connectHref(connector)} className={`${css.row}${connector.availability === "later" ? ` ${css.rowLater}` : ""}`} data-testid={`connector-${connector.id}`}>
      <ConnectorIconView icon={block.icon} size={24} />
      <span className={css.rowText}>
        <span className={css.rowTitle}>{block.title}</span>
        <span className={css.rowHint}>{block.blurb}</span>
      </span>
      <AvailabilityChip availability={connector.availability} />
    </Link>
  );
}
