import type { Metadata, Viewport } from "next";
import { Newsreader, Source_Sans_3 } from "next/font/google";
import { ConsentAnalytics } from "@/components/analytics/ConsentAnalytics";
import { site } from "@/lib/site";
import "./globals.css";

const newsreader = Newsreader({ subsets: ["latin"], variable: "--font-display", display: "swap" });
const sourceSans = Source_Sans_3({ subsets: ["latin"], variable: "--font-body", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: "Knowvia | Know your health cover", template: "%s | Knowvia" },
  description: site.description,
  applicationName: "Knowvia",
  alternates: { canonical: "/" },
  openGraph: { title: "Knowvia | Know your health cover", description: site.description, type: "website", url: "/" },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#163F42" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" className={`${newsreader.variable} ${sourceSans.variable}`}><body>{children}<ConsentAnalytics /></body></html>;
}
