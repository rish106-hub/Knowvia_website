"use client";

import { WarningCircle } from "@phosphor-icons/react";
import { useId, type ReactNode } from "react";

export type FieldControlProps = { id: string; "aria-describedby"?: string; "aria-invalid"?: true };

type FieldProps = {
  label: string;
  hint?: string;
  error?: string | null;
  children: (control: FieldControlProps) => ReactNode;
};

/** Visible label, optional hint, optional error. The control is rendered by the caller with the ids wired up. */
export function Field({ label, hint, error, children }: FieldProps) {
  const base = useId();
  const id = `${base}-control`;
  const hintId = `${base}-hint`;
  const errorId = `${base}-error`;
  const describedBy = [hint ? hintId : "", error ? errorId : ""].filter(Boolean).join(" ") || undefined;
  return (
    <div className="kva-field">
      <label className="kva-label" htmlFor={id}>
        {label}
      </label>
      {hint ? (
        <p className="kva-hint" id={hintId}>
          {hint}
        </p>
      ) : null}
      {children({ id, "aria-describedby": describedBy, "aria-invalid": error ? true : undefined })}
      {error ? (
        <p className="kva-field-error" id={errorId} role="alert">
          <WarningCircle size={20} weight="bold" aria-hidden="true" />
          <span>{error}</span>
        </p>
      ) : null}
    </div>
  );
}
