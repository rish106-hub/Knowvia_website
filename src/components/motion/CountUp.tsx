// Renders the final number in the HTML; MotionRoot animates the visible copy. Screen readers get
// the stable text only, never the intermediate numbers.
export function CountUp({ value, suffix = "" }: { value: number; suffix?: string }) {
  return (
    <span className="count-up">
      <span aria-hidden="true" data-count-to={value} data-count-suffix={suffix}>
        {value}
        {suffix}
      </span>
      <span className="sr-only">
        {value}
        {suffix}
      </span>
    </span>
  );
}

/** Splits "Shaped by 50+ family conversations" so the number can count up in place. */
export function TextWithCount({ text }: { text: string }) {
  const match = /(\d+)(\+?)/.exec(text);
  if (!match) return <>{text}</>;
  const before = text.slice(0, match.index);
  const after = text.slice(match.index + match[0].length);
  return (
    <>
      {before}
      <CountUp value={Number(match[1])} suffix={match[2]} />
      {after}
    </>
  );
}
