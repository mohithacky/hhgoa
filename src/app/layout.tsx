import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hacker House Goa 2026 — Builder Pass",
  description:
    "Upload a photo. Get your Hacker House Goa 2026 builder pass in seconds. Frame yourself in Goa. #FrameInGoa",
  keywords: ["Hacker House Goa", "HH Goa 2026", "Builder Pass", "FrameInGoa"],
  openGraph: {
    title: "Hacker House Goa 2026 — Builder Pass",
    description:
      "Upload a photo. Get your Hacker House Goa 2026 builder pass in seconds. #FrameInGoa",
    type: "website",
    siteName: "HH Goa 2026 Builder Pass",
  },
  twitter: {
    card: "summary_large_image",
    title: "Hacker House Goa 2026 — Builder Pass",
    description:
      "Upload a photo. Get your Hacker House Goa 2026 builder pass in seconds. #FrameInGoa",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#0B3D2E",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col font-body">
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
