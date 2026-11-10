"use client";

import Link from "next/link";
import {
  Brain,
  Coins,
  Compass,
  Lightbulb,
  MessagesSquare,
  PenLine,
  Sparkles,
  Sprout,
  type LucideIcon,
} from "lucide-react";
import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";
import type { ContentSource, Topic, TopicIcon as TopicIconKey } from "@/lib/types";

export function cx(...parts: (string | false | null | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

/** Exposes a topic's colours as CSS variables: use `text-(--t)` / `bg-(--t-soft)`. */
export function topicVars(topic: Topic): CSSProperties {
  return { "--t": topic.themeColor, "--t-soft": topic.softColor } as CSSProperties;
}

const ICONS: Record<TopicIconKey, LucideIcon> = {
  messages: MessagesSquare,
  brain: Brain,
  coins: Coins,
  compass: Compass,
  lightbulb: Lightbulb,
  sprout: Sprout,
};

export function TopicIcon({ icon, className }: { icon: TopicIconKey; className?: string }) {
  const Icon = ICONS[icon];
  return <Icon className={className} aria-hidden />;
}

export function TopicBadge({ topic, size = "md" }: { topic: Topic; size?: "sm" | "md" | "lg" }) {
  const box = size === "lg" ? "size-12 rounded-2xl" : size === "sm" ? "size-8 rounded-xl" : "size-10 rounded-xl";
  const icon = size === "lg" ? "size-6" : size === "sm" ? "size-4" : "size-5";
  return (
    <span
      style={topicVars(topic)}
      className={cx("grid shrink-0 place-items-center bg-(--t-soft) text-(--t)", box)}
    >
      <TopicIcon icon={topic.icon} className={icon} />
    </span>
  );
}

type Variant = "primary" | "accent" | "outline" | "ghost" | "topic";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-ink text-white hover:bg-black disabled:bg-ink/30",
  accent: "bg-accent text-white hover:bg-accent-deep disabled:bg-accent/40",
  topic: "bg-(--t) text-white hover:brightness-95 disabled:opacity-40",
  outline: "border border-line bg-card text-ink hover:border-ink/40 disabled:opacity-50",
  ghost: "text-ink-soft hover:bg-sand hover:text-ink disabled:opacity-50",
};

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-[15px] font-semibold transition active:scale-[0.98] disabled:active:scale-100";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button type="button" className={cx(BUTTON_BASE, VARIANTS[variant], className)} {...props} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  className,
  children,
}: {
  href: string;
  variant?: Variant;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={cx(BUTTON_BASE, VARIANTS[variant], className)}>
      {children}
    </Link>
  );
}

/**
 * Makes the origin of a piece of text explicit: a live AI response, or
 * pre-written content shown because no AI is configured (demo mode).
 */
export function SourceTag({ source, demoLabel }: { source: ContentSource; demoLabel?: string }) {
  if (source === "ai") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold tracking-wide text-white uppercase">
        <Sparkles className="size-3" aria-hidden /> AI response
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-sand px-2.5 py-1 text-[11px] font-semibold tracking-wide text-ink-soft uppercase">
      <PenLine className="size-3" aria-hidden /> {demoLabel ?? "Pre-written · demo mode"}
    </span>
  );
}

export function SectionHeading({
  title,
  action,
  hint,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-semibold">{title}</h2>
        {hint && <p className="mt-1 text-sm text-ink-soft">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cx("font-display inline-flex items-baseline text-2xl font-bold", className)}>
      Aha<span className="text-accent">.</span>
    </span>
  );
}
