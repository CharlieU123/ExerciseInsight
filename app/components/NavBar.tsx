"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home", icon: "H" },
  { href: "/add-workout", label: "Log", icon: "+" },
  { href: "/programs", label: "Programs", icon: "P" },
  { href: "/progress", label: "Progress", icon: "/" },
  { href: "/settings", label: "Settings", icon: "S" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="app-sidebar fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-white/10 bg-gray-950/90 text-white backdrop-blur-xl lg:flex">
        <Link
          href="/"
          className="flex items-center gap-3 border-b border-white/10 px-6 py-7"
        >
          <Image
            src="/exerciseinsight-mark.svg"
            alt=""
            width={96}
            height={96}
            priority
            className="h-12 w-12 rounded-2xl shadow-lg shadow-cyan-500/20"
          />
          <span>
            <span className="block truncate text-xl font-bold leading-tight">
              ExerciseInsight
            </span>
            <span className="block text-xs font-semibold text-gray-400">
              Performance Platform
            </span>
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-2 px-4 py-8">
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "group flex items-center gap-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 font-semibold text-cyan-300 shadow-lg shadow-cyan-950/20"
                    : "group flex items-center gap-4 rounded-2xl px-4 py-3 font-semibold text-gray-500 hover:bg-white/5 hover:text-gray-100"
                }
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-lg text-lg">
                  {link.icon}
                </span>
                <span>{link.label}</span>
                {isActive && (
                  <span className="ml-auto h-2 w-2 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(34,211,238,0.9)]" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 to-violet-500 text-sm font-bold text-gray-950">
              EI
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold">ExerciseInsight</p>
              <p className="text-sm text-gray-500">Training dashboard</p>
            </div>
          </div>
        </div>
      </aside>

      <header className="app-mobile-header sticky top-0 z-20 border-b border-white/10 bg-gray-950/85 text-white backdrop-blur lg:hidden">
        <nav className="mx-auto flex max-w-6xl px-4 py-3 sm:px-6">
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
        </nav>
      </header>

      <nav className="app-bottom-tabs fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-gray-950/90 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 text-white shadow-[0_-18px_44px_rgba(0,0,0,0.32)] backdrop-blur-xl lg:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
          {links.map((link) => {
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={
                  isActive
                    ? "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl bg-cyan-400/10 px-2 py-2 text-center text-xs font-semibold text-cyan-300 shadow-[0_0_22px_rgba(34,211,238,0.12)]"
                    : "flex min-h-14 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-center text-xs font-semibold text-gray-500 hover:bg-white/5 hover:text-gray-200"
                }
              >
                <span className="text-base leading-none">{link.icon}</span>
                <span className="leading-none">{link.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
