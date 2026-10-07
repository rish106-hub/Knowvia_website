import type { Metadata, Viewport } from "next";
import { Geist, Source_Sans_3 } from "next/font/google";
import { ConsentProvider } from "@/components/consent/ConsentProvider";
import { KnowviaGuide } from "@/components/guide/KnowviaGuide";
import { MotionRoot } from "@/components/motion/MotionRoot";
import { SiteFooter } from "@/components/site/SiteFooter";
import { SiteHeader } from "@/components/site/SiteHeader";
import { headInitScript } from "@/lib/init-scripts";
import { JsonLd, organizationJsonLd } from "@/lib/seo";
import { assertProductionConfig, siteConfig } from "@/lib/site";
import "./globals.css";
import "./components.css";
import "./motion.css";

assertProductionConfig();

// Fonts are downloaded at build time and served from this site; no runtime request to Google.
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-source-sans", display: "swap" });
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: { default: `${siteConfig.name}: ${siteConfig.tagline}`, template: `%s | ${siteConfig.name}` },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  robots: siteConfig.indexable ? { index: true, follow: true } : { index: false, follow: false },
  icons: { icon: "/brand/knowvia-mark.svg" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f7f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0c2426" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en-IN" className={`${sourceSans.variable} ${geist.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: headInitScript }} />
        <JsonLd data={organizationJsonLd()} />
      </head>
      <body>
        <ConsentProvider>
          <a className="skip-link" href="#main">
            Skip to content
          </a>
          <SiteHeader />
          <main id="main" tabIndex={-1}>
            {children}
          </main>
          <SiteFooter />
          <KnowviaGuide />
          <MotionRoot />
        </ConsentProvider>
      </body>
    </html>
  );
}
