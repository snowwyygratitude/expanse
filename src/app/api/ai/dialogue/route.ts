import { NextResponse } from "next/server";
import { experienceById } from "@/experiences";
import { extractJson, getProvider } from "@/lib/ai/provider";
import { dialoguePrompt } from "@/lib/ai/prompts";

const DEMO = () => NextResponse.json({ source: "demo" });

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const scenario = typeof body.scenarioId === "string" ? experienceById[body.scenarioId] : undefined;
  if (!scenario || scenario.kind !== "dialogue") {
    return NextResponse.json({ error: "Unknown scenario" }, { status: 404 });
  }
  const node = typeof body.nodeId === "string" ? scenario.nodes[body.nodeId] : undefined;
  if (!node) return NextResponse.json({ error: "Unknown node" }, { status: 404 });

  const choiceId = typeof body.choiceId === "string" ? body.choiceId : undefined;
  const freeText = typeof body.freeText === "string" ? body.freeText.trim().slice(0, 200) : undefined;
  if (!freeText && !node.options.some((o) => o.id === choiceId)) {
    return NextResponse.json({ error: "Unknown choice" }, { status: 400 });
  }
  const history = Array.isArray(body.history)
    ? body.history
        .filter((h): h is { who: "them" | "you"; text: string } =>
          Boolean(h) && (h.who === "them" || h.who === "you") && typeof h.text === "string",
        )
        .slice(-12)
        .map((h) => ({ who: h.who, text: h.text.slice(0, 200) }))
    : [];

  const provider = getProvider();
  if (!provider) return DEMO();

  try {
    const text = await provider.complete(dialoguePrompt({ scenario, node, choiceId, freeText, history }));
    const parsed = extractJson(text) as { choiceId?: unknown; reply?: unknown } | null;
    // Guardrail: the branch must be one of the authored options for this node.
    const resolved = freeText ? parsed?.choiceId : choiceId;
    const option = node.options.find((o) => o.id === resolved);
    const reply = typeof parsed?.reply === "string" ? parsed.reply.trim().replace(/^["“]|["”]$/g, "") : "";
    if (!option) return DEMO();
    return NextResponse.json({
      source: "ai",
      choiceId: option.id,
      reply: reply && reply.length <= 180 ? reply : option.reaction.text,
    });
  } catch (error) {
    console.error("[aha] dialogue fell back to authored branch:", error);
    return DEMO();
  }
}
