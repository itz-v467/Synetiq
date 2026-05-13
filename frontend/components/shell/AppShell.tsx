"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const topNav = [
  { href: "/", label: "Dashboard" },
  { href: "/meetings", label: "Meetings" },
  { href: "/insights", label: "Insights" },
];

const sideNav = [
  { href: "/", label: "Dashboard", icon: "grid_view" },
  { href: "/meetings", label: "Meetings", icon: "event_note" },
  { href: "/insights", label: "Insights", icon: "history" },
  { href: "/analytics", label: "Analytics", icon: "leaderboard" },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="relative min-h-screen">
      <header className="glass-header fixed left-1/2 top-4 z-50 mx-auto flex w-[min(95%,1120px)] -translate-x-1/2 items-center justify-between gap-4 px-gutter py-2 pl-6 pr-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-headline-lg font-bold text-primary md:text-display-xl">
            Synetiq
          </Link>
          <nav className="hidden items-center gap-2 md:flex">
            {topNav.map((item) => {
              const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={
                    active
                      ? "rounded-pill border-b-2 border-secondary-container px-3 py-1 text-body-md font-semibold text-secondary-on-container"
                      : "rounded-pill px-3 py-1 text-body-md text-on-surface-variant transition hover:bg-surface-container-high"
                  }
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-2">
          <div className="input-pill mr-2 hidden items-center gap-2 sm:flex">
            <span className="material-symbols-outlined text-line text-[20px]">search</span>
            <input className="w-40 max-w-[12rem] border-0 bg-transparent text-body-sm focus:ring-0 md:w-48" placeholder="Search meetings…" readOnly />
          </div>
          <button type="button" className="rounded-pill p-2 text-on-surface-variant transition hover:bg-surface-container-high" aria-label="Notifications">
            <span className="material-symbols-outlined text-[22px]">notifications</span>
          </button>
          <button type="button" className="rounded-pill p-2 text-on-surface-variant transition hover:bg-surface-container-high" aria-label="AI">
            <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
          </button>
          <a href="/legacy/mom" className="btn-ai-primary hidden text-center sm:inline-block">
            Legacy MOM
          </a>
          <button type="button" className="btn-primary">
            New meeting
          </button>
        </div>
      </header>

      <aside className="pill-nav fixed left-4 top-1/2 z-40 hidden w-16 -translate-y-1/2 flex-col items-center gap-6 py-8 md:flex lg:left-8 lg:w-20">
        <span className="material-symbols-outlined text-[28px] text-lime">hub</span>
        <nav className="flex flex-col gap-2">
          {sideNav.map((item) => {
            const active = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={
                  active
                    ? "flex items-center justify-center rounded-full bg-lime p-3 text-primary shadow-lg shadow-lime/30"
                    : "flex items-center justify-center rounded-full p-3 text-primary-foreground/60 transition hover:text-lime"
                }
                aria-label={item.label}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
              </Link>
            );
          })}
          <Link
            href="/settings"
            className={
              pathname.startsWith("/settings")
                ? "flex items-center justify-center rounded-full bg-lime p-3 text-primary shadow-lg shadow-lime/30"
                : "flex items-center justify-center rounded-full p-3 text-primary-foreground/60 transition hover:text-lime"
            }
            aria-label="Settings"
          >
            <span className="material-symbols-outlined">settings</span>
          </Link>
        </nav>
        <Link
          href="/live"
          className={
            pathname.startsWith("/live")
              ? "mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-white p-0 text-primary ring-2 ring-lime"
              : "mt-2 flex h-10 w-10 items-center justify-center rounded-full bg-lime text-primary transition hover:scale-105"
          }
          aria-label="Live capture"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            mic
          </span>
        </Link>
      </aside>

      <main className="mx-auto max-w-7xl px-4 pb-16 pt-28 md:pl-24 md:pr-8 md:pt-32 lg:pl-28">
        {children}
      </main>
    </div>
  );
}
