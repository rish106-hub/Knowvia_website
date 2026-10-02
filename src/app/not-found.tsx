import Link from "next/link";

export default function NotFound() {
  return (
    <section className="wrap page-header" style={{ minHeight: "50vh" }}>
      <h1>This page does not exist</h1>
      <p className="lede">The link may be old or mistyped.</p>
      <div className="button-row">
        <Link href="/" className="button">
          Go to the home page
        </Link>
        <Link href="/blog" className="button button-quiet">
          Browse the guides
        </Link>
      </div>
    </section>
  );
}
