"use client";

import { Check } from "lucide-react";
import type { Topic } from "@/lib/types";
import { cx, TopicIcon, topicVars } from "./ui";

export function TopicCard({
  topic,
  selected,
  onToggle,
}: {
  topic: Topic;
  selected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      style={topicVars(topic)}
      className={cx(
        "group relative flex h-full flex-col items-start gap-3 rounded-3xl border-2 p-4 text-left transition duration-200 active:scale-[0.98] md:p-5",
        selected
          ? "border-(--t) bg-(--t-soft) shadow-sm"
          : "border-transparent bg-card shadow-[0_1px_0_var(--color-line)] ring-1 ring-line hover:-translate-y-0.5 hover:ring-(--t)",
      )}
    >
      <span
        className={cx(
          "grid size-11 place-items-center rounded-2xl transition",
          selected ? "bg-(--t) text-white" : "bg-(--t-soft) text-(--t)",
        )}
      >
        <TopicIcon icon={topic.icon} className="size-5.5" />
      </span>
      <span>
        <span className="block text-[15px] leading-snug font-semibold">{topic.name}</span>
        <span className="mt-1 block text-[13px] leading-snug text-ink-soft">{topic.description}</span>
      </span>
      <span
        className={cx(
          "absolute top-3.5 right-3.5 grid size-6 place-items-center rounded-full border-2 transition",
          selected ? "animate-pop border-(--t) bg-(--t) text-white" : "border-line text-transparent",
        )}
      >
        <Check className="size-3.5" strokeWidth={3} aria-hidden />
      </span>
    </button>
  );
}
