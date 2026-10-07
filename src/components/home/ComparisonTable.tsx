// "Why not just search it?" Each row is a statement about method, not a performance claim, and
// the last row says plainly what neither option does.

const rows = [
  {
    topic: "Where answers come from",
    general: "How policies usually work, gathered from across the web",
    knowvia: "The documents you add, with the page each fact came from",
  },
  {
    topic: "When documents disagree",
    general: "Can return 1 confident answer",
    knowvia: "Shows the conflict and keeps it open until the insurer confirms",
  },
  {
    topic: "What to do next",
    general: "General advice for everyone",
    knowvia: "1 action with an owner, for your situation",
  },
  {
    topic: "Claim decisions",
    general: "Cannot approve a claim or say what will be paid",
    knowvia: "Cannot either. Only the insurer decides, and Knowvia says so",
  },
];

export function ComparisonTable() {
  return (
    <section className="section" aria-labelledby="compare-title">
      <div className="wrap">
        <div className="section-head" data-reveal>
          <h2 id="compare-title">Why not search or use a general chatbot?</h2>
          <p>General answers explain policies. Knowvia keeps the answer tied to the documents you actually depend on.</p>
        </div>
        <div className="compare-wrap" data-reveal>
          <table className="compare">
            <caption className="sr-only">Searching the web or asking a general chatbot, compared with Knowvia</caption>
            <thead>
              <tr>
                <th scope="col">What matters</th>
                <th scope="col">Searching, or a general chatbot</th>
                <th scope="col" className="compare-us">
                  Knowvia
                </th>
              </tr>
            </thead>
            <tbody data-reveal-stagger>
              {rows.map((row) => (
                <tr key={row.topic}>
                  <th scope="row">{row.topic}</th>
                  <td data-label="Searching, or a general chatbot">{row.general}</td>
                  <td data-label="Knowvia" className="compare-us">
                    {row.knowvia}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
