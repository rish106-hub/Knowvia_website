import Link from "next/link";

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <Link className="brand-mark" href="/" aria-label="Knowvia home">
      <span className="brand-icon" aria-hidden="true">K</span>
      {!compact && <span>Knowvia</span>}
    </Link>
  );
}
