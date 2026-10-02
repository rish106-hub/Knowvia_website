import { RouteTilt } from "./RouteTilt";

// "Route to clarity": policy documents enter on a tilted plane, branch into what is covered,
// what is a gap and what stays unconfirmed, and one gold route reaches the next action.
// The drawing is decorative; the ordered list carries the same meaning as text.

export function RouteScene() {
  return (
    <figure className="route-figure">
      <RouteTilt>
        <div className="route-stage" aria-hidden="true">
          <div className="route-plane">
            <svg viewBox="0 0 600 420" className="route-svg" focusable="false">
              <defs>
                <pattern id="route-grid" width="30" height="30" patternUnits="userSpaceOnUse">
                  <path d="M30 0H0V30" fill="none" className="route-grid-line" />
                </pattern>
              </defs>
              <rect x="0" y="0" width="600" height="420" rx="18" className="route-ground" />
              <rect x="0" y="0" width="600" height="420" rx="18" fill="url(#route-grid)" />

              {/* Branches */}
              <path className="route-branch route-known" d="M184 226 C 250 226, 270 120, 380 112" />
              <path className="route-branch route-gap" d="M184 232 C 250 236, 280 330, 372 336" />
              <path className="route-branch route-unknown" d="M184 229 C 260 229, 300 214, 360 222" />
              <path className="route-gold" d="M184 229 C 300 232, 380 262, 452 214 S 520 168, 540 170" />

              {/* Nodes */}
              <circle className="route-node route-node-known" cx="388" cy="112" r="11" />
              <rect className="route-node route-node-gap" x="372" y="326" width="20" height="20" rx="3" />
              <circle className="route-node route-node-unknown" cx="372" cy="222" r="11" />
              <circle className="route-origin" cx="184" cy="229" r="9" />
            </svg>
            <div className="route-doc route-doc-3">
              <span />
              <span />
              <span />
            </div>
            <div className="route-doc route-doc-2">
              <span />
              <span />
              <span />
            </div>
            <div className="route-doc route-doc-1">
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className="route-pin" />
            <div className="route-next-card">
              <span className="route-next-diamond" />
              <span className="route-next-text">Next action</span>
            </div>
          </div>
        </div>
      </RouteTilt>
      <figcaption>
        <ol className="route-legend">
          <li>
            <span className="status-dot status-known" aria-hidden="true" />
            <span>
              <strong>Known.</strong> What the documents confirm, with the page it came from.
            </span>
          </li>
          <li>
            <span className="status-dot status-gap" aria-hidden="true" />
            <span>
              <strong>Gap or conflict.</strong> Where cover runs out or two documents disagree.
            </span>
          </li>
          <li>
            <span className="status-dot status-unknown" aria-hidden="true" />
            <span>
              <strong>Unknown.</strong> What only the insurer can confirm. It stays open, not guessed.
            </span>
          </li>
          <li>
            <span className="status-dot status-next" aria-hidden="true" />
            <span>
              <strong>Next.</strong> One action that moves the household or team forward.
            </span>
          </li>
        </ol>
      </figcaption>
    </figure>
  );
}
