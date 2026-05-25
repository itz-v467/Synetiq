"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";



const sideNav = [
  { href: "/", label: "Dashboard", icon: "grid_view" },
  { href: "/meetings", label: "Meetings", icon: "event_note" },
  { href: "/generate", label: "MOM Generator", icon: "auto_awesome" },
  { href: "/communities", label: "Communities", icon: "groups" },
  { href: "/search", label: "Search", icon: "search" },
];

import { useState, useEffect } from "react";
import { CreateMeetingDialog } from "@/components/meetings/CreateMeetingDialog";
import { NotificationsPanel } from "@/components/shell/NotificationsPanel";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleOpen = () => setIsModalOpen(true);
    window.addEventListener("open-new-meeting", handleOpen);
    return () => window.removeEventListener("open-new-meeting", handleOpen);
  }, []);

  return (
    <div className="relative min-h-screen">
      <header className="glass-header fixed left-1/2 top-4 z-50 mx-auto flex w-[min(95%,1120px)] -translate-x-1/2 items-center justify-between gap-4 px-gutter py-2 pl-6 pr-3">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-headline-lg font-bold text-primary md:text-display-xl drop-shadow-sm">
            Synetiq
          </Link>

        </div>
        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <div onClick={() => router.push("/search")} className="input-pill mr-2 hidden items-center gap-2 lg:flex cursor-pointer hover:bg-surface-container-high transition">
            <span className="material-symbols-outlined text-muted text-[20px]">search</span>
            <span className="w-32 xl:w-40 text-body-sm text-muted/70 truncate">Search meetings…</span>
          </div>
          <button type="button" onClick={() => router.push("/search")} className="lg:hidden rounded-pill p-2 text-muted transition hover:bg-surface-container-high hover:text-primary" aria-label="Search">
            <span className="material-symbols-outlined text-[22px]">search</span>
          </button>
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen((o) => !o)}
              className="rounded-pill p-2 text-muted transition hover:bg-surface-container-high hover:text-primary"
              aria-label="Notifications"
            >
              <span className="material-symbols-outlined text-[22px]">notifications</span>
            </button>
            {notificationsOpen && <NotificationsPanel onClose={() => setNotificationsOpen(false)} />}
          </div>
          <button type="button" onClick={() => setIsModalOpen(true)} className="btn-primary whitespace-nowrap ml-1 text-sm sm:text-base px-3 sm:px-5">
            New meeting
          </button>
        </div>
      </header>

      <CreateMeetingDialog 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ["meetings"] });
          queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        }}
      />

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
                    ? "flex items-center justify-center rounded-full bg-lime p-3 text-white shadow-lg shadow-lime/30"
                    : "flex items-center justify-center rounded-full p-3 text-muted transition hover:bg-surface-container-highest hover:text-primary"
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
                ? "flex items-center justify-center rounded-full bg-lime p-3 text-white shadow-lg shadow-lime/30"
                : "flex items-center justify-center rounded-full p-3 text-muted transition hover:bg-surface-container-highest hover:text-primary"
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
