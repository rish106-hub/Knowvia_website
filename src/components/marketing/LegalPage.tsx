import { PageHeader } from "./PageHeader";
import { siteConfig } from "@/lib/site";

interface LegalPageProps {
  title: string;
  path: string;
  lede: string;
  updated: string;
  children: React.ReactNode;
}

export function LegalPage({ title, path, lede, updated, children }: LegalPageProps) {
  return (
    <>
      <PageHeader title={title} lede={lede} path={path}>
        <p className="small muted">Last updated {updated}</p>
      </PageHeader>
      <div className="wrap" style={{ paddingBottom: "5rem" }}>
        <div className="prose">
          {!siteConfig.legalReviewApproved ? (
            <p className="legal-draft">
              <strong>Draft.</strong> This text is awaiting review by a qualified Indian lawyer and may change before
              launch.
            </p>
          ) : null}
          {children}
        </div>
      </div>
    </>
  );
}

export function OperatorName() {
  return <>{siteConfig.operatorName ?? "the Knowvia project team"}</>;
}

export function PrivacyContact() {
  return siteConfig.privacyEmail ? (
    <a href={`mailto:${siteConfig.privacyEmail}`}>{siteConfig.privacyEmail}</a>
  ) : (
    <>the privacy contact that will be published here before launch</>
  );
}
