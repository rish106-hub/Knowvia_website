"use client";

import { useId, useState } from "react";
import { calculateCashScenario, formatRupees } from "./cash-scenario";

const ROOM_OPTIONS = [
  { value: 5000, label: "Room within the limit (₹5,000 a day)" },
  { value: 8000, label: "Larger single room (₹8,000 a day)" },
] as const;

export function CashScenarioDemo() {
  const [chosenRoomPerDay, setChosenRoomPerDay] = useState<number>(8000);
  const [days, setDays] = useState(4);
  const [roomBasedBilling, setRoomBasedBilling] = useState(true);
  const daysId = useId();

  const result = calculateCashScenario({
    roomRentLimitPerDay: 5000,
    chosenRoomPerDay,
    days,
    roomLinkedCharges: 1_20_000,
    otherCharges: 60_000,
    sumInsuredAvailable: 10_00_000,
    hospitalUsesRoomBasedBilling: roomBasedBilling,
  });

  return (
    <div className="cash-demo">
      <form className="cash-controls" onSubmit={(event) => event.preventDefault()}>
        <fieldset className="field">
          <legend>Room chosen</legend>
          <div className="stack" style={{ "--stack-space": "0.5rem" } as React.CSSProperties}>
            {ROOM_OPTIONS.map((option) => (
              <label key={option.value} className="check">
                <input
                  type="radio"
                  name="room"
                  value={option.value}
                  checked={chosenRoomPerDay === option.value}
                  onChange={() => setChosenRoomPerDay(option.value)}
                />
                <span>{option.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <div className="field">
          <label htmlFor={daysId}>Days in hospital: {days}</label>
          <input
            id={daysId}
            type="range"
            min={1}
            max={10}
            value={days}
            onChange={(event) => setDays(Number(event.target.value))}
          />
        </div>
        <label className="check">
          <input type="checkbox" checked={roomBasedBilling} onChange={(event) => setRoomBasedBilling(event.target.checked)} />
          <span>The hospital charges more for doctor and nursing fees in larger rooms</span>
        </label>
      </form>
      <div className="cash-result" aria-live="polite">
        <dl className="fact-list">
          <dt>Total bill</dt>
          <dd>{formatRupees(result.totalBill)}</dd>
          <dt>Insurer pays here</dt>
          <dd>{formatRupees(result.insurerPays)}</dd>
          <dt>Family pays</dt>
          <dd>
            <strong>{formatRupees(result.familyPays)}</strong>
          </dd>
        </dl>
        <p className="small muted">
          {result.proportion < 1
            ? `Room-linked charges of ${formatRupees(120000)} are paid in the proportion ${Math.round(result.proportion * 100)}%, because the room cost more than the limit. Medicines, implants and tests (${formatRupees(60000)}) are paid in full in this example.`
            : "No proportion applies here, so only the room charge above the limit (if any) is left to the family."}
        </p>
        <p className="small muted">
          Your amount depends on your plan documents, the hospital&apos;s billing and the insurer&apos;s decision.
        </p>
      </div>
    </div>
  );
}
