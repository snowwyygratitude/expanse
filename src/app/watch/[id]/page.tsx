import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StoryHost } from "@/components/story/StoryHost";
import { experienceById, experiences } from "@/experiences";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return experiences.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const experience = experienceById[(await params).id];
  return { title: experience ? `${experience.title} · Aha` : "Aha" };
}

export default async function WatchPage({ params }: Props) {
  const { id } = await params;
  if (!experienceById[id]) notFound();
  return <StoryHost id={id} />;
}
