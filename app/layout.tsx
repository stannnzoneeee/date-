import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  // Link previews (Messenger, Instagram) need absolute image URLs.
  metadataBase: new URL("https://can-we-have-a-date-po.vercel.app"),
  title: "A little question for you 💌",
  description: "One little question, a very big crush. Will you go on a date with me?",
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-32.png", type: "image/png", sizes: "32x32" },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "A little question for you 💌",
    description: "Special delivery. Just for you.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f8dcd8",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
