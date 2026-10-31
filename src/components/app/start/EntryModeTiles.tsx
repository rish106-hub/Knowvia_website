import Link from "next/link";
import { ArrowRight } from "@phosphor-icons/react/ssr";
import css from "./start.module.css";

// S00. Three ways in plus "Sign in". Targets are fixed by the plan: no session is read or fetched here.
// The sign-in modes are carried as a query only; the sign-in screen decides what to do with them.
const TILES = [
  { href: "/app/emergency", title: "Someone needs care now", hint: "Steps for the next hour. No account needed.", primary: true },
  { href: "/app/sign-in?mode=planned", title: "Care is coming up", hint: "See what your documents say before it happens.", primary: false },
  { href: "/app/sign-in?mode=asked", title: "Someone asked me to set this up", hint: "Bring the family's papers together, once.", primary: false },
] as const;

export function EntryModeTiles() {
  return (
    <div className={css.screen}>
      <div className={css.head}>
        <h1 className={css.h1}>What do you need right now?</h1>
        <p className={css.lead}>Pick one. It takes about a minute to get to something useful.</p>
      </div>

      <ul className={css.tiles} aria-label="Ways to start">
        {TILES.map((tile) => (
          <li key={tile.href}>
            <Link href={tile.href} className={tile.primary ? `${css.tile} ${css.tilePrimary}` : css.tile} data-testid="entry-tile">
              <span className={css.tileText}>
                <span className={css.tileTitle}>{tile.title}</span>
                <span className={css.tileHint}>{tile.hint}</span>
              </span>
              <ArrowRight size={tile.primary ? 24 : 20} weight="regular" className={css.tileArrow} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>

      <div className={css.foot}>
        <Link href="/app/sign-in" className={`${css.pill} ${css.pillSecondary}`}>
          Sign in
        </Link>
        <p className={css.footNote}>
          You choose what we can read, and you can take it back any time. <span className={css.review}>DRAFT · LEGAL REVIEW</span>
        </p>
      </div>
    </div>
  );
}
