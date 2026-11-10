"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, House, Sprout } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { useApp } from "@/lib/store";
import { cx, Logo } from "./ui";

const NAV = [
  { href: "/home", label: "Home", icon: House },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/growth", label: "My Growth", icon: Sprout },
];

/** Shared frame for Home, Explore, My Growth and the journey overview. */
export function AppShell({ children }: { children: ReactNode }) {
  const { hydrated, profile } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const ready = hydrated && profile.onboardingCompleted;

  useEffect(() => {
    if (hydrated && !profile.onboardingCompleted) router.replace("/");
  }, [hydrated, profile.onboardingCompleted, router]);

  const isActive = (href: string) =>
    pathname === href || (href === "/home" && pathname === "/journey");

  return (
    <div className="min-h-dvh pb-28 md:pb-16">
      <header className="sticky top-0 z-30 border-b border-line/70 bg-paper/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-5 md:h-16 md:px-8">
          <Link href="/home" aria-label="Aha home">
            <Logo />
          </Link>
          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary">
            {NAV.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={isActive(href) ? "page" : undefined}
                className={cx(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  isActive(href) ? "bg-ink text-white" : "text-ink-soft hover:bg-sand hover:text-ink",
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 pt-6 md:px-8 md:pt-10">
        {ready ? <div className="animate-rise">{children}</div> : <ShellSkeleton />}
      </main>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold transition",
                  active ? "text-accent" : "text-ink-faint",
                )}
              >
                <span
                  className={cx(
                    "grid h-8 w-14 place-items-center rounded-full transition",
                    active && "bg-accent-soft",
                  )}
                >
                  <Icon className="size-5" strokeWidth={active ? 2.4 : 2} aria-hidden />
                </span>
                {label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function ShellSkeleton() {
  return (
    <div className="animate-pulse space-y-5" aria-hidden>
      <div className="h-8 w-1/2 rounded-full bg-sand" />
      <div className="h-56 rounded-[2rem] bg-sand" />
      <div className="h-32 rounded-3xl bg-sand" />
    </div>
  );
}
