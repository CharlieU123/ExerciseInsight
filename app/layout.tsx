import type { Metadata, Viewport } from "next";
import { NavBar } from "./components/NavBar";
import { PwaRegister } from "./components/PwaRegister";
import { ThemeInitializer } from "./components/ThemeInitializer";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExerciseInsight",
  description:
    "Track workout sessions, profile details, and weekly training progress.",
  applicationName: "ExerciseInsight",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ExerciseInsight",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/favicon.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#2563eb",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
      data-theme="dark"
      style={{ "--accent": "#2563eb" } as React.CSSProperties}
      suppressHydrationWarning
    >
      <body className="min-h-full bg-gray-950 text-white">
        <ThemeInitializer />
        <PwaRegister />
        <NavBar />
        {children}
      </body>
    </html>
  );
}
