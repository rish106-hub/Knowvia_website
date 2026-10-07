import { CashScenarioDemo } from "./CashScenarioDemo";
import { familyDemo, teamDemo, type FactStatus } from "./demo-data";
import { Walkthrough } from "./Walkthrough";

const statusLabel: Record<FactStatus, string> = {
  known: "Known",
  unknown: "Unknown",
  gap: "Gap",
  next: "Next",
};

export function StatusTag({ status }: { status: FactStatus }) {
  return (
    <span className={`status-tag status-tag-${status}`}>
      <span className={`status-dot status-${status}`} aria-hidden="true" />
      {statusLabel[status]}
    </span>
  );
}

export function FamilyWalkthrough() {
  return (
    <Walkthrough
      journey="family"
      title={familyDemo.householdName}
      steps={[
        {
          id: "cover",
          label: "Household cover",
          content: (
            <div className="demo-block">
              <p className="muted">Members: {familyDemo.members.join(", ")}</p>
              <table className="demo-table">
                <caption className="sr-only">Health plans held by the household</caption>
                <thead>
                  <tr>
                    <th scope="col">Plan</th>
                    <th scope="col">Cover amount</th>
                    <th scope="col">Covers</th>
                  </tr>
                </thead>
                <tbody>
                  {familyDemo.policies.map((policy) => (
                    <tr key={policy.name}>
                      <th scope="row">
                        {policy.name}
                        <span className="demo-note">{policy.note}</span>
                      </th>
                      <td>{policy.sumInsured}</td>
                      <td>{policy.covers}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ),
        },
        {
          id: "answers",
          label: "What we know",
          content: (
            <ul className="fact-rows">
              {familyDemo.facts.map((fact) => (
                <li key={fact.label} className="fact-row">
                  <StatusTag status={fact.status} />
                  <div>
                    <p className="fact-row-label">{fact.label}</p>
                    <p className="muted">{fact.detail}</p>
                    {"source" in fact && fact.source ? <p className="fact-source">Page: {fact.source}</p> : null}
                  </div>
                </li>
              ))}
            </ul>
          ),
        },
        {
          id: "cash",
          label: "Hospital cost",
          content: (
            <div className="demo-block">
              <p className="muted">
                Meera is admitted under the family floater for a planned surgery. How much could the family pay if she
                chooses a larger room?
              </p>
              <CashScenarioDemo />
            </div>
          ),
        },
        {
          id: "next",
          label: "Next steps",
          content: (
            <ol className="next-steps">
              {familyDemo.nextSteps.map((step) => (
                <li key={step.action}>
                  <p className="fact-row-label">{step.action}</p>
                  <p className="muted small">
                    Owner: {step.owner}. When: {step.due}.
                  </p>
                </li>
              ))}
            </ol>
          ),
        },
      ]}
    />
  );
}

export function TeamWalkthrough() {
  return (
    <Walkthrough
      journey="team"
      title={`${teamDemo.companyName}, ${teamDemo.headcount} employees`}
      steps={[
        {
          id: "enrolment",
          label: "Enrolment status",
          content: (
            <ul className="meter-list">
              {teamDemo.enrolment.map((row) => (
                <li key={row.label}>
                  <div className="meter-head">
                    <span>{row.label}</span>
                    <StatusTag status={row.status as FactStatus} />
                  </div>
                  <div
                    className={`meter meter-${row.status}`}
                    role="img"
                    aria-label={`${row.value} of ${row.of}`}
                    style={{ "--meter": `${(row.value / row.of) * 100}%` } as React.CSSProperties}
                  />
                  <p className="small muted">
                    {row.value} of {row.of}
                  </p>
                </li>
              ))}
            </ul>
          ),
        },
        {
          id: "questions",
          label: "Employee questions",
          content: (
            <ul className="fact-rows">
              {teamDemo.questions.map((question) => (
                <li key={question.topic} className="fact-row">
                  <span className="question-count">{question.count} asked</span>
                  <div>
                    <p className="fact-row-label">{question.topic}</p>
                    <p className="muted">{question.answer}</p>
                  </div>
                </li>
              ))}
            </ul>
          ),
        },
        {
          id: "handoffs",
          label: "Who does what",
          content: (
            <ul className="fact-rows">
              {teamDemo.handoffs.map((handoff) => (
                <li key={handoff.action} className="fact-row">
                  <StatusTag status={handoff.status as FactStatus} />
                  <div>
                    <p className="fact-row-label">{handoff.action}</p>
                    <p className="muted small">Owner: {handoff.owner}</p>
                  </div>
                </li>
              ))}
            </ul>
          ),
        },
      ]}
    />
  );
}
