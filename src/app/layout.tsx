import type { Metadata, Viewport } from "next";
import "@fontsource/gloock/400.css";
import "@fontsource-variable/instrument-sans/wght.css";
import "./globals.css";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { site } from "@/lib/site";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const siteUrl = process.env.SITE_URL;
const ogImage = { url: `${basePath}/og-image.png`, width: 1200, height: 630, alt: "AskQueen: Sabrina's sarcastic tarot, roasts and songs" };

export const metadata: Metadata = {
  // Link previews need a full image address, so the preview image is only
  // added when SITE_URL (e.g. https://you.github.io) is set at build time.
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: {
    default: `${site.name} | ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  openGraph: {
    title: site.name,
    description: site.description,
    type: "website",
    ...(siteUrl ? { images: [ogImage] } : {}),
  },
  twitter: {
    card: siteUrl ? "summary_large_image" : "summary",
    title: site.name,
    description: site.description,
    ...(siteUrl ? { images: [ogImage.url] } : {}),
  },
};

export const viewport: Viewport = {
  themeColor: "#302033",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh flex-col antialiased">
        <SiteHeader />
        <main id="main" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
