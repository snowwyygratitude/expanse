import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { getLesson, lessons } from "@/content";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return lessons.map((lesson) => ({ id: lesson.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const lesson = getLesson((await params).id);
  return { title: lesson ? `${lesson.title} · Aha` : "Aha" };
}

export default async function LessonPage({ params }: Props) {
  const lesson = getLesson((await params).id);
  if (!lesson) notFound();
  return <LessonPlayer key={lesson.id} lesson={lesson} />;
}
