/**
 * Wishes: whisper one, and the garden grows it.
 *
 * Where a worry is a stone that is set down and soothed, a wish is a seed of
 * light that takes root and is encouraged. A DesireSpec is the only shape that
 * reaches the garden: a dawn scene (validated like any scene), one line that
 * reflects the wish back, and three blossoms: what the wish says about the
 * person, what is already true, and one first step. Claude writes it when
 * available; otherwise a small library of hand-written themes does.
 */
import { WishSpec, validateSpec } from './world/scene';
import { askModel, currentComposer, Composer } from './ai';
import { CRISIS, Petal } from './worry';
import { DESIRE_SYSTEM } from '../shared/prompts.mjs';

export interface DesireSpec { wish: string; feeling?: string; scene: WishSpec; reflect: string; blossoms: Petal[]; by: Composer; }
export const BLOSSOM_LABELS = ['What this wish says about you', 'What is already true', 'One first step'];
export const WISH_STARTERS: [string, string][] = [['something I’d like to make', 'I’d like to make '], ['someone I’d like to become', 'I’d like to become '], ['somewhere I’d like to go', 'I’d like to go '], ['a way I’d like to feel', 'I’d like to feel '], ['something else', '']];
export const FEELINGS = ['excited', 'gratitude', 'joyful', 'at peace'];

interface Theme { re: RegExp; name: string; line: string; value: string; already: string; step: string; emotions: Record<string, number>; features: [string, number][]; }
const THEMES: Theme[] = [
  { re: /writ|book|novel|story|paint|draw|art\b|music|song|album|film|design|build|make (a|an|my|something|things|art|music|films?|games?|pottery|ceramics|clothes|furniture)|create|craft|pottery|ceramic|app\b|game|invent|photograph|podcast|blog|poem/,
    name: 'The Maker’s Morning', line: 'Something of yours is asking to exist. The garden has made room for it.',
    value: 'Wanting to make this says you have something of your own to say, and you care about saying it well.',
    already: 'It already exists in one place: you can picture it. Most things that get made began exactly there.',
    step: 'Give it twenty unhurried minutes this week. A rough first piece is enough, and nobody has to see it.',
    emotions: { hope: 1, joy: 0.6, curiosity: 0.5 }, features: [['sun', 0.8], ['rays', 0.8], ['hopeSprouts', 1], ['motes', 0.8], ['butterflies', 0.6]] },
  { re: /business|company|startup|studio|shop|store|freelanc|switch careers|change careers|career change|new career|career|job|promot|work for myself|my own boss|launch|client|lead a|manager|found(er)?\b|profession|open (a|my)|\blead\b|senior|raise\b/,
    name: 'The Open Road at Dawn', line: 'You are picturing work that is truly yours. The light is coming up on it.',
    value: 'This wish says you want your effort to count for something you chose. That is ambition with a direction.',
    already: 'You know what you would do differently, and why it matters. That knowledge is the hard part, and you already have it.',
    step: 'Write down the smallest real version of this, and tell one person about it this week.',
    emotions: { hope: 1, joy: 0.5, courage: 0.25 }, features: [['sun', 0.9], ['rays', 1], ['mountains', 0.7], ['path', 0.9], ['birds', 0.9], ['hopeSprouts', 0.7]] },
  { re: /travel|trip|visit|move to|live in|abroad|country|city|ocean|sea\b|mountain|journey|explore|adventure|see the world|go to|somewhere/,
    name: 'The Far Horizon', line: 'Somewhere is calling you. The garden has opened its sky toward it.',
    value: 'Wanting to go says you are still curious about the world, and brave enough to want more of it.',
    already: 'You already know where. A place you can name is a place you can plan for.',
    step: 'Look up one real detail this week: a route, a season, or a cost. One fact makes it more real.',
    emotions: { hope: 0.9, curiosity: 0.9, joy: 0.4 }, features: [['sun', 0.7], ['clouds', 0.5], ['birds', 1], ['mountains', 0.8], ['rainbow', 0.4], ['motes', 0.6]] },
  { re: /love|partner|relationship|marry|married|family|friends?|new friends|child|baby|parent|closer|connect|belong|community|someone to|together|reconcil|forgiv/,
    name: 'The Garden With Room', line: 'You are wishing for closeness. The garden has made a warm place for it.',
    value: 'This wish says people matter to you, and that you are willing to be known. That takes more courage than it sounds.',
    already: 'You already know how to care about someone. This wish only exists because that is true.',
    step: 'Reach toward one person this week with something small and honest: a message, an invitation, a thank you.',
    emotions: { hope: 0.9, gratitude: 0.9, joy: 0.5 }, features: [['sun', 0.6], ['warmBlooms', 1], ['butterflies', 0.9], ['puffs', 0.8], ['petals', 0.5]] },
  { re: /health|healthy|strong|fit\b|fitness|run\b|running|marathon|exercise|body|sleep|heal|recover|quit|sober|eat better|energy|weight|yoga|walk/,
    name: 'The Greening', line: 'You are wishing your body well. Everything here is leaning toward the light with you.',
    value: 'This wish says you want to be here, and feel good being here. That is a deep kind of self-respect.',
    already: 'You are still listening to your body. Wanting this is the first sign of taking care of it.',
    step: 'Choose one kind thing for your body tomorrow morning, small enough that you will actually do it.',
    emotions: { hope: 1, calm: 0.6, joy: 0.4 }, features: [['sun', 0.8], ['rays', 0.6], ['hopeSprouts', 1], ['blooms', 0.6], ['birds', 0.7], ['koi', 0.5]] },
  { re: /calm|peace|rest\b|quiet|slow|still|balance|less stress|less anxious|anxi|worry less|feel (better|lighter|okay|ok)|simple|simplify|breathe|ease|gentle|time for myself|content|happy|joy|enjoy/,
    name: 'The Unhurried Light', line: 'You are wishing for ease. The garden is holding the morning still for you.',
    value: 'Wanting this says you know what matters to you, and that you are done trading it away.',
    already: 'You can still tell what peace feels like. That means it has not gone far.',
    step: 'Protect ten quiet minutes tomorrow, on purpose. Treat them as an appointment.',
    emotions: { hope: 0.8, calm: 1, gratitude: 0.4 }, features: [['sun', 0.6], ['mist', 0.3], ['lake', 0.8], ['koi', 0.8], ['petals', 0.6], ['fireflies', 0.4], ['hopeSprouts', 0.6]] },
  { re: /become|be more|braver|brave|confident|confidence|kinder|patient|disciplin|learn|study|degree|master|skill|language|school|college|university|course|grow|better at|speak up|leader|wiser|honest/,
    name: 'The Slow Unfolding', line: 'You are wishing to grow into someone. The garden knows about growing.',
    value: 'This wish says you take your own life seriously, and believe you can still change. Not everyone lets themselves want that.',
    already: 'The person you are picturing is built from things you already value. You are closer to them than it feels.',
    step: 'Do one small thing this week the way that person would do it. Once is enough to begin.',
    emotions: { hope: 1, curiosity: 0.5, calm: 0.4 }, features: [['sun', 0.7], ['rays', 0.7], ['hopeSprouts', 1], ['treeGlow', 0.6], ['motes', 0.7], ['birds', 0.5]] },
];
// a home, savings, being free of debt: wanting steady ground to stand on
THEMES.push({ re: /\bhome\b|house|apartment|\bflat\b|debt|save (money|up)|savings|financial|financially|secure|security|stable|stability|retire|pay off|emergency fund|my own place/,
  name: 'The Steady Ground', line: 'You are wishing for solid ground under your feet. The garden is laying it down, stone by stone.',
  value: 'This wish says you want to feel safe, and to give yourself somewhere to rest. That is a wise and caring thing to want.',
  already: 'You are already thinking about it clearly, and that is where every steady foundation starts.',
  step: 'Pick one number to know this week: what you have, what you need, or one small amount to set aside.',
  emotions: { hope: 1, calm: 0.7, gratitude: 0.3 }, features: [['sun', 0.6], ['hopeSprouts', 0.8], ['birds', 0.6], ['motes', 0.5], ['koi', 0.4]] });
// helping others, giving back, making a difference
THEMES.push({ re: /help (others|people|kids|children|someone|my community)|helping|volunteer|give back|giving back|mentor|teach|make a difference|difference in|charity|nonprofit|non-profit|change the world|impact|serve|support others/,
  name: 'The Open Hand', line: 'You are wishing to make things better for someone else. The garden is opening toward the light with you.',
  value: 'This wish says your care reaches beyond yourself. That is one of the most generous things a person can carry.',
  already: 'You already notice what others need. That noticing is where all real help begins.',
  step: 'Find one small way to help this week, even for an hour, and let it be enough for now.',
  emotions: { hope: 1, gratitude: 0.8, joy: 0.4 }, features: [['sun', 0.7], ['rays', 0.7], ['warmBlooms', 0.8], ['butterflies', 0.8], ['hopeSprouts', 0.6], ['birds', 0.5]] });

const DEFAULT: Theme = {
  re: /./, name: 'The First Light', line: 'A wish has been said out loud. The garden heard it, and morning is coming up.',
  value: 'Wanting something this clearly says you have not given up on your own life. That is worth honouring.',
  already: 'You have already done the hardest part, which is to admit you want it.',
  step: 'Name the very next small thing that would move this forward, and do only that this week.',
  emotions: { hope: 1, joy: 0.5, calm: 0.3 }, features: [['sun', 0.8], ['rays', 0.8], ['hopeSprouts', 0.9], ['birds', 0.7], ['motes', 0.6]],
};

const clean = (s: unknown, max: number) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '');
function pick(wish: string): Theme {
  let best = DEFAULT, top = 0; const w = wish.toLowerCase();
  for (const th of THEMES) { const n = (w.match(new RegExp(th.re.source, 'gi')) ?? []).reduce((a, m) => a + (m.length >= 7 ? 2 : 1), 0); if (n > top) { top = n; best = th; } }
  return best;
}
/** the feeling they met when they pictured it true, woven into the line the garden says back */
const withFeeling = (line: string, feeling?: string) => {
  const f = feeling?.trim(); if (!f) return line;
  return FEELINGS.includes(f.toLowerCase()) ? `You pictured it true and felt ${f.toLowerCase()}. ${line}` : `You pictured it true: “${f}”. ${line}`;
};
/** a wish's morning never has a storm, a gate or a door in it: it is a place to grow, not to leave */
function tidy(scene: WishSpec): WishSpec {
  const e = scene.emotions; delete e.fear; delete e.sadness; e.hope = Math.max(e.hope ?? 0, 0.7);
  const never = ['storm', 'passage', 'door', 'waterDoor', 'rain', 'mushrooms', 'path', 'floaters', 'gifts', 'lanterns', 'memoryLantern'];
  scene.features = (scene.features ?? []).filter(f => !never.includes(f.key));
  for (const key of never) scene.features.push({ key, amount: 0 });
  return scene;
}

export function composeDesireLocally(wish: string, feeling?: string): DesireSpec {
  const th = pick(wish);
  return {
    wish, feeling, by: 'local', reflect: withFeeling(th.line, feeling),
    blossoms: [th.value, th.already, th.step].map((text, i) => ({ label: BLOSSOM_LABELS[i], text })),
    scene: tidy({ name: th.name, whisper: th.line, emotions: { ...th.emotions }, features: th.features.map(([key, amount]) => ({ key, amount })) }),
  };
}

/** Untrusted model output -> a DesireSpec, with every gap filled from the local library. */
export function validateDesire(raw: any, wish: string, by: Composer, feeling?: string): DesireSpec | 'crisis' {
  const base = composeDesireLocally(wish, feeling);
  if (!raw || typeof raw !== 'object') return base;
  if (raw.crisis === true) return 'crisis';
  const texts = [clean(raw.value, 220), clean(raw.already, 220), clean(raw.step, 220)];
  const scene = validateSpec(raw.scene)?.spec;
  return {
    wish, feeling, by, reflect: clean(raw.reflect, 200) || base.reflect,
    blossoms: texts.map((t, i) => ({ label: BLOSSOM_LABELS[i], text: t || base.blossoms[i].text })),
    scene: scene ? tidy(scene) : base.scene,
  };
}

export async function composeDesire(wish: string, feeling?: string): Promise<DesireSpec | 'crisis'> {
  const text = wish.trim().slice(0, 300), felt = feeling?.trim().slice(0, 120) || undefined;
  if (CRISIS.test(text) || (felt && CRISIS.test(felt))) return 'crisis';
  const by = currentComposer();
  if (by === 'local') return composeDesireLocally(text, felt);
  const prompt = `${DESIRE_SYSTEM}\n\nTheir wish: "${text}"` + (felt ? `\n\nAsked "Imagine it's already true. What do you feel first?", they said: "${felt}".` : '');
  const raw = await askModel('/api/desire', { wish: text, feeling: felt }, prompt);
  return raw ? validateDesire(raw, text, by, felt) : composeDesireLocally(text, felt);
}

/** what the garden says when someone tells the wish tree what they did */
export function stepLine(n: number): string {
  if (n === 1) return 'The first leaf. A wish with one step behind it is already a plan.';
  if (n === 2) return 'A second leaf. You came back to it, and that is how things get made.';
  if (n === 3) return 'Three leaves now. This is starting to look like something you do.';
  if (n === 5) return 'Five leaves. Look how much of this is already behind you.';
  if (n === 10) return 'Ten leaves. This is not only a wish any more.';
  return ['Another leaf. It counts, however small it felt.', 'It grew a little. So did you.', 'One more leaf. Steady is faster than it looks.', 'A new leaf. The tree remembers every one of these.'][n % 4];
}
