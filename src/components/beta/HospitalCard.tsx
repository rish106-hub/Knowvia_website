// Signed-out hospital moment: non-personal information only. FOR LEGAL REVIEW: wording.
export function HospitalCard({ onBack }: { onBack: () => void }) {
  return (
    <section className="beta-card">
      <h1>In hospital now</h1>
      <h2 className="beta-rule">Cashless steps</h2>
      <ol className="beta-list">
        <li>Call the helpline on the back of your health card.</li>
        <li>Ask the hospital&apos;s insurance desk to send a cashless request to your insurer.</li>
        <li>Keep your health card and a photo ID ready.</li>
      </ol>
      <h2 className="beta-rule">Documents to carry</h2>
      <ul className="beta-list">
        <li>Health card or policy number</li>
        <li>Photo ID</li>
        <li>Doctor&apos;s admission note</li>
      </ul>
      <button type="button" className="beta-button" onClick={onBack}>Back</button>
    </section>
  );
}
