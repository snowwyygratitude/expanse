/**
 * AI service abstraction. Everything in the app talks to `AIProvider`, so
 * swapping or adding a model vendor only touches this file.
 *
 * Server-side only: API keys are read from environment variables and are
 * never sent to the browser.
 */

export interface CompletionRequest {
  system: string;
  user: string;
  maxTokens?: number;
}

export interface AIProvider {
  name: "anthropic" | "openai";
  model: string;
  complete(request: CompletionRequest): Promise<string>;
}

const TIMEOUT_MS = 25_000;

async function postJson(url: string, headers: Record<string, string>, body: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(`AI request failed (${response.status}): ${detail.slice(0, 300)}`);
  }
  return response.json();
}

function anthropicProvider(apiKey: string): AIProvider {
  const model = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
  return {
    name: "anthropic",
    model,
    async complete({ system, user, maxTokens = 600 }) {
      const data = await postJson(
        `${process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com"}/v1/messages`,
        { "x-api-key": apiKey, "anthropic-version": "2023-06-01" },
        { model, max_tokens: maxTokens, system, messages: [{ role: "user", content: user }] },
      );
      const blocks: { type: string; text?: string }[] = data?.content ?? [];
      return blocks
        .filter((b) => b.type === "text")
        .map((b) => b.text ?? "")
        .join("")
        .trim();
    },
  };
}

function openAIProvider(apiKey: string): AIProvider {
  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  return {
    name: "openai",
    model,
    async complete({ system, user, maxTokens = 600 }) {
      const data = await postJson(
        `${process.env.OPENAI_BASE_URL || "https://api.openai.com/v1"}/chat/completions`,
        { authorization: `Bearer ${apiKey}` },
        {
          model,
          max_completion_tokens: maxTokens,
          messages: [
            { role: "system", content: system },
            { role: "user", content: user },
          ],
        },
      );
      return String(data?.choices?.[0]?.message?.content ?? "").trim();
    },
  };
}

/**
 * Returns the configured provider, or null when no API key is available
 * (the app then runs entirely on curated, pre-authored content).
 *
 * AI_PROVIDER=anthropic|openai picks explicitly; otherwise the first
 * provider with a key wins.
 */
export function getProvider(): AIProvider | null {
  const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
  const openAIKey = process.env.OPENAI_API_KEY?.trim();
  const preferred = process.env.AI_PROVIDER?.trim().toLowerCase();

  if (preferred === "openai" && openAIKey) return openAIProvider(openAIKey);
  if (preferred === "anthropic" && anthropicKey) return anthropicProvider(anthropicKey);
  if (anthropicKey) return anthropicProvider(anthropicKey);
  if (openAIKey) return openAIProvider(openAIKey);
  return null;
}

/** Pulls the first JSON object out of a model response. */
export function extractJson(text: string): unknown {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
