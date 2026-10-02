import { CookieSettingsButton } from "@/components/consent/ConsentProvider";
import { LegalPage } from "@/components/marketing/LegalPage";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Cookie notice",
  description: "Which cookies and browser storage the Knowvia website uses, what each is for, and how to change your choice.",
  path: "/cookies",
});

const storage = [
  {
    name: "kv_consent",
    category: "Essential",
    purpose: "Remembers your cookie choice.",
    duration: "180 days",
  },
  {
    name: "kv-theme (local storage)",
    category: "Essential",
    purpose: "Remembers light or dark theme if you choose one.",
    duration: "Until you clear it",
  },
  {
    name: "Cloudflare Turnstile",
    category: "Essential",
    purpose: "Bot check, loaded only when you open the sign-up form.",
    duration: "Session",
  },
  {
    name: "ph_* (PostHog)",
    category: "Analytics",
    purpose: "Counts a fixed list of site actions. Only after you allow analytics.",
    duration: "Up to 1 year",
  },
  {
    name: "_gcl_*, _ga* (Google)",
    category: "Advertising",
    purpose: "Measures whether an ad led to a sign-up. Only after you allow advertising.",
    duration: "Up to 13 months",
  },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie notice"
      path="/cookies"
      lede="Only essential storage is used until you choose otherwise. Analytics and advertising stay off unless you turn them on."
      updated="2 October 2026"
    >
      <p>
        <CookieSettingsButton className="button" />
      </p>
      <table className="demo-table">
        <caption className="sr-only">Cookies and storage used by this site</caption>
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Category</th>
            <th scope="col">Purpose</th>
            <th scope="col">Duration</th>
          </tr>
        </thead>
        <tbody>
          {storage.map((item) => (
            <tr key={item.name}>
              <th scope="row">{item.name}</th>
              <td>{item.category}</td>
              <td>{item.purpose}</td>
              <td>{item.duration}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p>
        Rejecting analytics and advertising does not limit anything on the site. You can still read every guide, try the
        examples and join early access.
      </p>
    </LegalPage>
  );
}
