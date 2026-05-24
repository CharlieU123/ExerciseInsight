import type { Metadata } from "next";
import { NavBar } from "./components/NavBar";
import { ThemeInitializer } from "./components/ThemeInitializer";
import "./globals.css";

export const metadata: Metadata = {
  title: "ExerciseInsight",
  description:
    "Track workout sessions, profile details, and weekly training progress.",
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
        <NavBar />
        {children}
      </body>
    </html>
  );
}
