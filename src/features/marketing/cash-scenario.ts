// Illustrative room-rent arithmetic for the synthetic family walkthrough.
// Amounts are whole rupees. This is a teaching model, not a claim estimate: the real outcome
// depends on the policy wording, the hospital's billing and the insurer's decision.

export interface CashScenarioInput {
  roomRentLimitPerDay: number;
  chosenRoomPerDay: number;
  days: number;
  /** Charges the policy wording links to the room category (for example doctor and nursing fees). */
  roomLinkedCharges: number;
  /** Charges outside the room link (for example pharmacy, implants, diagnostics). */
  otherCharges: number;
  sumInsuredAvailable: number;
  /** Whether the hospital bills differently by room category. Without it, no proportion applies. */
  hospitalUsesRoomBasedBilling: boolean;
}

export interface CashScenarioResult {
  totalBill: number;
  roomPayable: number;
  roomLinkedPayable: number;
  otherPayable: number;
  proportion: number;
  coveredBeforeSumInsuredCap: number;
  insurerPays: number;
  familyPays: number;
  cappedBySumInsured: boolean;
}

function assertWholeNonNegative(name: string, value: number): void {
  if (!Number.isFinite(value) || value < 0 || !Number.isInteger(value)) {
    throw new RangeError(`${name} must be a whole, non-negative number of rupees`);
  }
}

export function calculateCashScenario(input: CashScenarioInput): CashScenarioResult {
  for (const [name, value] of Object.entries(input)) {
    if (typeof value === "number") assertWholeNonNegative(name, value);
  }
  if (input.roomRentLimitPerDay === 0 || input.chosenRoomPerDay === 0) {
    throw new RangeError("Room rates must be greater than zero");
  }

  const roomCharges = input.chosenRoomPerDay * input.days;
  const totalBill = roomCharges + input.roomLinkedCharges + input.otherCharges;
  const overLimit = input.chosenRoomPerDay > input.roomRentLimitPerDay;
  const proportion =
    overLimit && input.hospitalUsesRoomBasedBilling ? input.roomRentLimitPerDay / input.chosenRoomPerDay : 1;

  const roomPayable = Math.min(input.chosenRoomPerDay, input.roomRentLimitPerDay) * input.days;
  const roomLinkedPayable = Math.floor(input.roomLinkedCharges * proportion);
  const otherPayable = input.otherCharges;
  const coveredBeforeSumInsuredCap = roomPayable + roomLinkedPayable + otherPayable;
  const insurerPays = Math.min(coveredBeforeSumInsuredCap, input.sumInsuredAvailable);

  return {
    totalBill,
    roomPayable,
    roomLinkedPayable,
    otherPayable,
    proportion,
    coveredBeforeSumInsuredCap,
    insurerPays,
    familyPays: totalBill - insurerPays,
    cappedBySumInsured: coveredBeforeSumInsuredCap > input.sumInsuredAvailable,
  };
}

const rupeeFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatRupees(amount: number): string {
  return rupeeFormatter.format(amount);
}
