import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const configuredSiteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "").trim().replace(/^['"]|['"]$/g, "");
const siteUrl = /^https?:\/\//i.test(configuredSiteUrl) ? configuredSiteUrl : "https://buy1minute.vercel.app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Buy1Minute — Own one minute of the internet",
    template: "%s · Buy1Minute",
  },
  description: "There are 1,440 minutes in a day. Own one permanently and take over the homepage for 60 seconds, every day.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "Buy1Minute — Own one minute of the internet",
    description: "Pick one. Own it permanently. Take over the homepage for 60 seconds every day.",
    type: "website",
    images: [{ url: "/og.png", width: 1_200, height: 630, alt: "Buy1Minute — 14:37" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
