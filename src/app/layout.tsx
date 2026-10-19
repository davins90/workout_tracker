import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Workout Tracker",
  description: "Track your gym exercises and progress.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  appleWebApp: {
    capable: true,
    title: "Workout",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#388fd6",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" suppressHydrationWarning>
      <head>
        {/* The manifest sits behind IAP, so the browser must send the login cookie to fetch it */}
        <link rel="manifest" href="/manifest.webmanifest" crossOrigin="use-credentials" />
      </head>
      <body className="antialiased min-h-screen bg-background font-sans">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
