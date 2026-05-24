"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/", label: "Home" },
  { href: "/add-workout", label: "Add Workout" },
  { href: "/programs", label: "Programs" },
  { href: "/library", label: "Library" },
  { href: "/goals", label: "Goals" },
  { href: "/history", label: "History" },
  { href: "/progress", label: "Progress" },
  { href: "/settings", label: "Settings" },
];

export function NavBar() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-gray-950/85 text-white backdrop-blur">
      <nav className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-3 sm:px-6 md:flex-row md:items-center md:justify-between md:py-4">
        <div className="flex items-center justify-between gap-3">
          <Link href="/" className="flex min-w-0 items-center gap-3">
            <Image
              src="/exerciseinsight-mark.svg"
              alt=""
              width={96}
              height={96}
              priority
              className="h-12 w-12 rounded-lg shadow-lg shadow-blue-950/40"
            />
            <span>
              <span className="block truncate text-xl font-bold leading-tight">
                ExerciseInsight
              </span>
              <span className="block text-xs font-semibold uppercase tracking-wide text-gray-400 sm:block">
                Training dashboard
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => setMenuOpen(!menuOpen)}
            className="rounded-md bg-white/10 px-3 py-2 text-sm font-semibold text-white hover:bg-white/15 md:hidden"
            aria-expanded={menuOpen}
            aria-controls="mobile-navigation"
          >
            {menuOpen ? "Close" : "Menu"}
          </button>
        </div>

        <div
          id="mobile-navigation"
          className={
            (menuOpen ? "grid" : "hidden") +
            " grid-cols-2 gap-2 md:flex md:flex-wrap md:items-center"
          }
        >
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className={
                  isActive
                    ? "rounded-md bg-blue-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-lg shadow-blue-950/30 transition"
                    : "rounded-md bg-white/5 px-3 py-2 text-center text-sm font-semibold text-gray-300 transition hover:bg-white/10 hover:text-white"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </header>
  );
}
