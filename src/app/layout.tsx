import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://worldcupclutch.com";
const SITE_NAME = "WorldCupClutch";
const TITLE = "WorldCupClutch — World Cup 2026 Predictions, Picks & Bracket Game";
const DESCRIPTION =
  "The ultimate World Cup 2026 prediction game. Pick match winners, build your streak, and compete on the global leaderboard across all 104 FIFA World Cup matches. Free to play.";
const OG_IMAGE = `${SITE_URL}/api/og`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: DESCRIPTION,

  keywords: [
    "World Cup 2026 predictions",
    "World Cup predictor",
    "World Cup bracket game",
    "football pick em",
    "FIFA prediction game",
    "World Cup betting game",
    "predict World Cup matches",
    "World Cup challenge",
    "soccer prediction game 2026",
    "FIFA World Cup 2026 picks",
    "football prediction app",
    "World Cup leaderboard",
  ],

  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,

  alternates: {
    canonical: "/",
  },

  openGraph: {
    type: "website",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: TITLE,
    description: DESCRIPTION,
    images: [
      {
        url: OG_IMAGE,
        width: 1200,
        height: 630,
        alt: "WorldCupClutch — World Cup 2026 Prediction Game",
      },
    ],
    locale: "en_US",
  },

  twitter: {
    card: "summary_large_image",
    site: "@worldcupclutch",
    creator: "@worldcupclutch",
    title: TITLE,
    description: DESCRIPTION,
    images: [OG_IMAGE],
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  verification: {
    // google: "your-google-verification-code",
  },

  category: "sports",
};

/* ─── JSON-LD Structured Data ─── */
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: SITE_NAME,
      description: DESCRIPTION,
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE_URL}/?match={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "SportsOrganization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/icon.png`,
      },
    },
    {
      "@type": "SportsEvent",
      name: "FIFA World Cup 2026",
      startDate: "2026-06-11",
      endDate: "2026-07-19",
      location: {
        "@type": "Place",
        name: "USA, Canada & Mexico",
      },
      organizer: {
        "@type": "Organization",
        name: "FIFA",
        url: "https://www.fifa.com",
      },
      description:
        "The 2026 FIFA World Cup, hosted across the United States, Canada, and Mexico, featuring 48 teams and 104 matches.",
      url: SITE_URL,
    },
    {
      "@type": "WebApplication",
      name: SITE_NAME,
      url: SITE_URL,
      applicationCategory: "SportsApplication",
      operatingSystem: "Web",
      description: DESCRIPTION,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
    },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" dir="ltr">
      <head>
        {/* Preconnect for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Theme color */}
        <meta name="theme-color" content="#03080f" />
        <meta name="color-scheme" content="dark" />

        {/* Mobile web app */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content={SITE_NAME} />

        {/* Viewport with safe areas */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        {/* JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body>
        <a href="#main-content" className="sr-only">Skip to main content</a>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}