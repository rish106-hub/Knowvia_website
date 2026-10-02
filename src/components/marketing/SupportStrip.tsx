import { supportMarks } from "@/content/evidence";

export function SupportStrip() {
  return (
    <section className="support-strip" aria-labelledby="support-label">
      <div className="wrap support-inner">
        <h2 id="support-label" className="support-label">
          With support from
        </h2>
        <ul className="support-marks">
          {supportMarks.map((mark) => (
            <li key={mark.name}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mark.file} alt={mark.name} width={mark.width} height={mark.height} loading="lazy" decoding="async" />
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
