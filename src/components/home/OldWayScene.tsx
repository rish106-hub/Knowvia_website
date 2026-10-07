// "The old way": the places one answer is scattered across fly into a pile, then a single view
// arrives with each fact sorted. Without JavaScript, or under reduced motion, it rests in its
// finished state. The rows reuse the invented Rao household from the walkthrough.

const scattered = [
  { label: "Policy PDF", x: -38, y: -30, r: -9 },
  { label: "Old e-card", x: 30, y: -42, r: 7 },
  { label: "HR slides", x: -46, y: 18, r: 5 },
  { label: "Renewal PDF", x: 44, y: 10, r: -6 },
  { label: "Schedule photo", x: -20, y: 48, r: 10 },
  { label: "Helpline call", x: 26, y: 44, r: -4 },
];

export function OldWayScene() {
  return (
    <section className="section old-way" aria-labelledby="old-way-title">
      <div className="wrap old-way-grid" data-inview>
        <div className="old-way-copy">
          <p className="eyebrow">The old way</p>
          <h2 id="old-way-title">1 question. 6 places.</h2>
          <p className="muted">
            Plans, e-cards, HR slides, emails and calls become 1 clear view.
          </p>
        </div>
        <div className="old-way-stage">
          <ul className="scatter" aria-label="Where the answers usually are">
            {scattered.map((item, index) => (
              <li
                key={item.label}
                style={
                  {
                    "--sx": `${item.x}%`,
                    "--sy": `${item.y}%`,
                    "--sr": `${item.r}deg`,
                    "--i": index,
                  } as React.CSSProperties
                }
              >
                {item.label}
              </li>
            ))}
          </ul>
          <span className="old-way-arrow" aria-hidden="true" />
          <div className="one-view">
            <p className="one-view-head">
              <span>With Knowvia</span>
            </p>
            <ul>
              <li style={{ "--i": 0 } as React.CSSProperties}>
                <span className="status-dot status-known" aria-hidden="true" />
                <span>
                  <strong>Found.</strong> ₹5,000/day. <span className="muted">Plan, p. 14</span>
                </span>
              </li>
              <li style={{ "--i": 1 } as React.CSSProperties}>
                <span className="status-dot status-unknown" aria-hidden="true" />
                <span>
                  <strong>Mismatch.</strong> 2 cataract limits.
                </span>
              </li>
              <li style={{ "--i": 2 } as React.CSSProperties}>
                <span className="status-dot status-next" aria-hidden="true" />
                <span>
                  <strong>Do next.</strong> Ask the insurer.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
