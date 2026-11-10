import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ExperienceHost } from "@/components/play/ExperienceHost";
import { experienceById, experiences } from "@/experiences";

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return experiences.map((e) => ({ id: e.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const experience = experienceById[(await params).id];
  return { title: experience ? `${experience.title} · Aha` : "Aha" };
}

export default async function PlayPage({ params }: Props) {
  const { id } = await params;
  if (!experienceById[id]) notFound();
  return <ExperienceHost id={id} />;
}
