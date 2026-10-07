const words = ["employer cover", "family floater", "parents' policy", "super top-up", "whole household"];

// Runs once through the policies a household tends to hold and stops on the last word inside five
// seconds, so it needs no pause control (WCAG 2.2.2). Static, on the last word, under reduced motion.
export function HeroTicker() {
  return (
    <p className="hero-kicker">
      <span aria-hidden="true">
        One clear view of your{" "}
        <span className="ticker-window">
          <span className="ticker-track" style={{ "--ticker-count": words.length } as React.CSSProperties}>
            {words.map((word) => (
              <span key={word}>{word}</span>
            ))}
          </span>
        </span>
      </span>
      <span className="sr-only">One clear view of your employer cover, family floater, parents&apos; policy and super top-up.</span>
    </p>
  );
}
