/**
 * Optional server for Expanse.
 *
 *   npm run build && ANTHROPIC_API_KEY=sk-ant-... npm start
 *
 * Serves the built garden from dist/ and adds one AI endpoint, POST /api/wish,
 * which asks Claude to compose a scene out of the garden's fixed component
 * library. The garden validates whatever comes back (src/world/scene.ts,
 * validateSpec) and falls back to its on-device composer if this server, the
 * key, or the model is unavailable. Nothing but the wish text and the names of
 * already-found skies is ever sent; memory-lantern notes never leave the device.
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Anthropic from '@anthropic-ai/sdk';
import { WORRY_SYSTEM, DESIRE_SYSTEM } from '../shared/prompts.mjs';

const PORT = Number(process.env.PORT ?? 8787);
const DIST = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const hasKey = Boolean(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN);
const client = hasKey ? new Anthropic() : null;

const EMOTIONS = ['joy', 'calm', 'sadness', 'curiosity', 'courage', 'gratitude', 'hope', 'fear'];
const FEATURES = ['sun', 'rays', 'moon', 'stars', 'aurora', 'clouds', 'rainbow', 'rain', 'storm', 'mist', 'petals', 'fireflies', 'motes', 'mountains', 'lake', 'waterDoor', 'blooms', 'blueBlooms', 'warmBlooms', 'hopeSprouts', 'mushrooms', 'door', 'path', 'passage', 'floaters', 'garlands', 'lanterns', 'memoryLantern', 'puffs', 'butterflies', 'birds', 'koi', 'treeGlow', 'treeGold', 'gifts'];

const SYSTEM = `You compose scenes for a small magical garden out of a fixed component library. You never invent components.

Given a person's wish, answer with ONE JSON object and nothing else (no markdown fence):
{
  "name": string,      // a 2-5 word poetic title for the scene, in title case
  "whisper": string,   // one gentle, concrete sentence (max 140 characters) describing what just appeared. No advice, no questions, no therapy language.
  "emotions": { ${EMOTIONS.map(e => `"${e}": number`).join(', ')} },  // 0..1, how much of each emotional material the scene is built from; usually two or three are non-zero
  "features": [ { "key": string, "amount": number } ],  // 3-9 entries that tune the scene, amount 0..1
  "sky": [string, string, string]   // sky gradient top, middle, horizon as #rrggbb
}

Allowed feature keys: ${FEATURES.join(', ')}.
What they are: sun/rays/moon/stars/aurora/clouds/rainbow are sky things; rain, storm (distant lightning), mist, petals (falling), fireflies, motes (floating light) are weather; mountains, lake, waterDoor (a glowing door under the lake), passage (a lit gate in the mountain) shape the land; blooms (bright flowers), blueBlooms (glowing blue flowers), warmBlooms (amber flowers), hopeSprouts (luminous seedlings), mushrooms (glowing) grow from the ground; door (a mysterious door), path (stepping stones), floaters (curious floating objects), garlands (string lights), lanterns (floating over the lake), memoryLantern are objects; puffs (small round creatures), butterflies, birds, koi are creatures; treeGlow, treeGold, gifts change the great tree.

Every emotion is beautiful here. Sadness is rain and blue light, never ruin. Compose something this person would find quietly wonderful.`;

async function askClaude(system, content) {
  const response = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 6000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    system,
    messages: [{ role: 'user', content }],
  });
  if (response.stop_reason === 'refusal') return null;
  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  return a >= 0 && b > a ? JSON.parse(text.slice(a, b + 1)) : null;
}

async function composeWish(wish, memory) {
  const seen = Array.isArray(memory?.discovered) ? memory.discovered.slice(0, 40).join(', ') : '';
  const response = await client.beta.messages.create({
    model: 'claude-opus-5-5',
    max_tokens: 4000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    output_config: { effort: 'low' },
    system: SYSTEM,
    messages: [{
      role: 'user',
      content: `This garden has already seen: ${seen || 'nothing yet'}. Prefer something it has not seen.\n\nThe wish: "${wish}"`,
    }],
  });
  if (response.stop_reason === 'refusal') return null;
  const text = response.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const a = text.indexOf('{'), b = text.lastIndexOf('}');
  return a >= 0 && b > a ? JSON.parse(text.slice(a, b + 1)) : null;
}

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json' };
const json = (res, code, body) => { res.writeHead(code, { 'content-type': 'application/json' }); res.end(JSON.stringify(body)); };

http.createServer(async (req, res) => {
  try {
    if (req.url === '/api/health') return json(res, 200, { ai: hasKey });
    if (req.url === '/api/desire' && req.method === 'POST') {
      if (!client) return json(res, 503, { error: 'no_key' });
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (raw.length > 8000) return json(res, 413, { error: 'too_long' }); }
      const body = JSON.parse(raw || '{}');
      if (typeof body.wish !== 'string' || !body.wish.trim()) return json(res, 400, { error: 'empty' });
      try {
        const felt = typeof body.feeling === 'string' && body.feeling.trim() ? `\n\nAsked "Imagine it's already true. What do you feel first?", they said: "${body.feeling.trim().slice(0, 120)}".` : '';
        const spec = await askClaude(DESIRE_SYSTEM, `Their wish: "${body.wish.trim().slice(0, 300)}"` + felt);
        return spec ? json(res, 200, spec) : json(res, 422, { error: 'no_scene' });
      } catch (err) {
        if (err instanceof Anthropic.RateLimitError) return json(res, 429, { error: 'rate_limited' });
        if (err instanceof Anthropic.APIError) return json(res, 502, { error: 'api_error', status: err.status });
        if (err instanceof SyntaxError) return json(res, 422, { error: 'no_scene' });
        throw err;
      }
    }
    if ((req.url === '/api/wish' || req.url === '/api/worry') && req.method === 'POST') {
      const worry = req.url === '/api/worry';
      if (!client) return json(res, 503, { error: 'no_key' });
      let raw = '';
      for await (const chunk of req) { raw += chunk; if (raw.length > 8000) return json(res, 413, { error: 'too_long' }); }
      const body = JSON.parse(raw || '{}'), wish = worry ? body.worry : body.wish, memory = body.memory;
      if (typeof wish !== 'string' || !wish.trim()) return json(res, 400, { error: 'empty' });
      try {
        const spec = worry
          ? await askClaude(WORRY_SYSTEM, `What they set down: "${wish.trim().slice(0, 400)}"` + (typeof body.part === 'string' && body.part.trim() ? `\n\nAsked "What part of this is weighing on you?", they said: "${body.part.trim().slice(0, 240)}". Let that part lead everything you write.` : ''))
          : await composeWish(wish.trim().slice(0, 280), memory);
        return spec ? json(res, 200, spec) : json(res, 422, { error: 'no_scene' });
      } catch (err) {
        // the garden falls back to its local composer on any non-200
        if (err instanceof Anthropic.RateLimitError) return json(res, 429, { error: 'rate_limited' });
        if (err instanceof Anthropic.AuthenticationError) return json(res, 503, { error: 'bad_key' });
        if (err instanceof Anthropic.APIError) return json(res, 502, { error: 'api_error', status: err.status });
        if (err instanceof SyntaxError) return json(res, 422, { error: 'no_scene' });
        throw err;
      }
    }
    const rel = decodeURIComponent((req.url ?? '/').split('?')[0]);
    const file = path.join(DIST, rel === '/' ? 'index.html' : rel);
    if (!file.startsWith(DIST)) return json(res, 403, { error: 'forbidden' });
    const data = await readFile(file).catch(() => readFile(path.join(DIST, 'index.html')));
    res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'text/html; charset=utf-8' });
    res.end(data);
  } catch (err) {
    console.error(err);
    json(res, 500, { error: 'server_error' });
  }
}).listen(PORT, () => console.log(`Expanse is growing at http://localhost:${PORT}  (AI wishes: ${hasKey ? 'on' : 'off, using the on-device composer'})`));
