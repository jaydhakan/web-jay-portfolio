import type { Metadata, Viewport } from "next";
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { seo, siteConfig } from "@/data/content";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CustomCursor } from "@/components/layout/CustomCursor";
import { ScrollProgress } from "@/components/layout/ScrollProgress";
import { SmoothScrollProvider } from "@/components/layout/SmoothScrollProvider";
import { AnchorScroll } from "@/components/layout/AnchorScroll";
import { ScrollTriggerLeakCounter } from "@/components/motion/ScrollTriggerLeakCounter";

const syne = Syne({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
  weight: ["300", "400", "500", "600"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jetbrains",
  weight: ["400", "500"],
});

/* Single canonical fallback — matches sitemap.ts and robots.ts (plan.md §8) */
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://jaydhakan.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: seo.home.title,
    template: `%s | ${siteConfig.name}`,
  },
  description: seo.home.description,
  openGraph: {
    title: seo.home.title,
    description: seo.home.description,
    url: siteUrl,
    siteName: siteConfig.name,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: `${siteConfig.name}, ${siteConfig.role}`,
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seo.home.title,
    description: seo.home.description,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#0b0b11",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
    >
      <body className="font-body">
        {/* Below-fold sections may use Motion whileInView reveals (data-reveal).
            Without JS those stay at opacity:0 — force them visible. */}
        <noscript>
          <style>{`[data-reveal]{opacity:1!important;transform:none!important}`}</style>
        </noscript>
        {/* Skip link: first focusable element on every page (a11y spec) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-accent-solid focus:px-4 focus:py-2 focus:text-ink"
        >
          Skip to content
        </a>
        <SmoothScrollProvider>
          <AnchorScroll />
          <ScrollTriggerLeakCounter />
          <CustomCursor />
          <ScrollProgress />
          <Header />
          {children}
          <Footer />
        </SmoothScrollProvider>
      </body>
    </html>
  );
}
