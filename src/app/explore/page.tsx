"use client";

import { AppShell } from "@/components/AppShell";
import { LessonCard } from "@/components/LessonCard";
import { TopicBadge, topicVars } from "@/components/ui";
import { lessonsForTopic, topics } from "@/content";
import { discoveryLesson, todaysLesson } from "@/lib/recommend";
import { useApp } from "@/lib/store";

export default function ExplorePage() {
  return (
    <AppShell>
      <Explore />
    </AppShell>
  );
}

function Explore() {
  const { profile, journey, progress } = useApp();
  const completed = progress.completedLessonIds;
  const today = todaysLesson(journey, profile, progress);
  const discovery = discoveryLesson(journey, profile, progress, today.id);
  const featured = [
    { lesson: today, note: journey?.reasons[today.id] ?? "Picked for you today." },
    ...(discovery ? [{ lesson: discovery, note: "Something from outside your usual path." }] : []),
  ];

  return (
    <div className="space-y-12">
      <section>
        <h1 className="font-display text-4xl leading-tight font-semibold md:text-5xl">Explore</h1>
        <p className="mt-2 max-w-xl text-lg text-ink-soft">
          Six areas, eighteen ideas. Open anything that makes you curious, in any order.
        </p>
        <nav aria-label="Topics" className="no-scrollbar -mx-5 mt-5 flex gap-2 overflow-x-auto px-5 md:mx-0 md:flex-wrap md:px-0">
          {topics.map((topic) => (
            <a
              key={topic.id}
              href={`#${topic.id}`}
              style={topicVars(topic)}
              className="shrink-0 rounded-full bg-(--t-soft) px-4 py-2 text-sm font-semibold text-(--t) transition hover:brightness-95"
            >
              {topic.shortName}
            </a>
          ))}
        </nav>
      </section>

      <section>
        <h2 className="text-xs font-bold tracking-[0.14em] text-accent uppercase">Recommended for you</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {featured.map(({ lesson, note }) => (
            <LessonCard
              key={lesson.id}
              lesson={lesson}
              completed={completed.includes(lesson.id)}
              showTopic
              note={note}
            />
          ))}
        </div>
      </section>

      {topics.map((topic) => {
        const list = lessonsForTopic(topic.id);
        const count = list.filter((l) => completed.includes(l.id)).length;
        return (
          <section key={topic.id} id={topic.id} className="scroll-mt-24" style={topicVars(topic)}>
            <div className="flex items-start gap-4">
              <TopicBadge topic={topic} size="lg" />
              <div className="min-w-0 flex-1">
                <h2 className="font-display text-2xl leading-tight font-semibold">{topic.name}</h2>
                <p className="mt-1 text-[15px] text-ink-soft">{topic.description}</p>
              </div>
              <div className="hidden shrink-0 items-center gap-1.5 pt-2 sm:flex" aria-label={`${count} of 3 explored`}>
                {list.map((l) => (
                  <span
                    key={l.id}
                    className={`size-2.5 rounded-full ${completed.includes(l.id) ? "bg-(--t)" : "bg-line"}`}
                  />
                ))}
              </div>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {list.map((lesson) => (
                <LessonCard key={lesson.id} lesson={lesson} completed={completed.includes(lesson.id)} />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
