/**
 * Worries: set one down, and the garden answers.
 *
 * A WorrySpec is the only shape that reaches the garden: a soothing scene
 * (validated like any wish), one sentence of acknowledgement, the belief that
 * may sit underneath, three gentler perspectives and three alternative
 * beliefs. Claude writes it when available; otherwise a small library of
 * hand-written themes does. This is a reflective toy, not treatment: words
 * that suggest someone is in danger never enter the game at all (see CRISIS).
 */
import { WishSpec, validateSpec } from './world/scene';
import { askModel, currentComposer, Composer } from './ai';
import { WORRY_SYSTEM } from '../shared/prompts.mjs';

export interface Petal { label: string; text: string; }
export interface WorrySpec {
  worry: string; scene: WishSpec; acknowledge: string; belief: string;
  petals: Petal[]; reframes: string[]; by: Composer;
}
export const PETAL_LABELS = ['What is actually known', 'What a friend would say', 'What is within reach'];

/** If any of this appears, the garden steps aside and points to real people. */
export const CRISIS = /(kill (myself|me|him|her|them)|suicid|end (it all|my life)|take my (own )?life|do(n'?t| not) want to (live|be alive|be here|exist)|want to die|wish i was dead|better off (dead|without me)|self[- ]?harm|hurt(ing)? myself|cut(ting)? myself|no reason to live)/i;
export const CRISIS_TITLE = 'You deserve more than a garden right now';
export const CRISIS_LINE = 'Please reach a person who can help. In the US or Canada, call or text 988. Elsewhere, findahelpline.com lists free, confidential lines near you. If you are in danger, call your local emergency number.';

interface Theme { re: RegExp; name: string; ack: string; belief: string; known: string; friend: string; reach: string; reframes: string[]; emotions: Record<string, number>; features: [string, number][]; }
const THEMES: Theme[] = [
  { re: /miss (him|her|them|you|my)|lost (my|him|her|them)|died|death|grief|griev|passed away|funeral|gone forever/,
    name: 'The Lantern Water', ack: 'Missing someone is love with nowhere to go. It makes sense that it aches.',
    belief: 'If I let this hurt less, it means I am letting go of them.',
    known: 'What you had was real, and it is still yours. That part cannot be taken.',
    friend: 'A friend would say: there is no right speed for this. You are not doing it wrong.',
    reach: 'One small act of remembering is within reach. A name said aloud, a photo, a light.',
    reframes: ['I can carry them with me and still have lighter days.', 'Grief is not a problem I have to solve.', 'Feeling joy again does not betray them.'],
    emotions: { calm: 1, gratitude: 0.7, sadness: 0.3 }, features: [['lanterns', 1], ['stars', 0.7], ['rain', 0], ['blueBlooms', 0.6], ['fireflies', 0.6]] },
  { re: /not (good|smart|pretty|thin|strong|talented) enough|not enough|worthless|useless|stupid|ugly|hate myself|i'?m a failure|loser|imposter|impostor|fraud|compar|behind everyone|everyone else/,
    name: 'The Garden As It Is', ack: 'That is a painful thing to carry around. Thank you for setting it down here for a moment.',
    belief: 'I am not enough as I am.',
    known: '“Not enough” is a feeling, not a measurement. Nobody has ever actually measured it.',
    friend: 'A friend would say: I do not keep a list of what is wrong with you. I am just glad you are here.',
    reach: 'Name one thing you did today, however small. It counts.',
    reframes: ['I am allowed to be a work in progress.', 'I do not have to earn my place here.', 'The way I talk to myself can be gentler than this.'],
    emotions: { calm: 1, gratitude: 0.8 }, features: [['warmBlooms', 1], ['butterflies', 0.8], ['fireflies', 0.7], ['gifts', 0]] },
  { re: /fail|presentation|exam|test|interview|deadline|mistake|mess(ed)? up|perform|boss|job|work|career|promotion|review|grade|school|project/,
    name: 'The Unhurried Evening', ack: 'Of course this feels heavy. It matters to you, and that is why it is loud.',
    belief: 'If I get this wrong, it will prove I am not good enough.',
    known: 'The outcome has not happened yet. What exists right now is preparation, and a mind rehearsing the worst version.',
    friend: 'A friend would say: you have got through hard things before, and one result has never been the whole of you.',
    reach: 'One small piece is within reach today. Fifteen minutes on the very next step is enough to begin.',
    reframes: ['My worth is not decided by one result.', 'I can be nervous and still do this well enough.', 'A mistake is something that happens, not something I am.'],
    emotions: { calm: 1, hope: 0.7 }, features: [['lanterns', 0.7], ['hopeSprouts', 0.9], ['rainbow', 0.2], ['fireflies', 0.5]] },
  { re: /friend|partner|boyfriend|girlfriend|husband|wife|relationship|lonely|alone|reject|leave me|left me|ignor|text(ed)? back|likes? me|hates? me|judg|think of me|embarrass|awkward|family|mother|father|mom|dad/,
    name: 'The Shore of Kept Company', ack: 'Wanting to be close to people, and fearing it could go wrong, is one of the most human things there is.',
    belief: 'If people saw the real me, they would leave.',
    known: 'You know what was said and done. What they are thinking is a guess, and worry tends to guess the harshest answer.',
    friend: 'A friend would say: the people who stay are staying for you, not for a flawless version of you.',
    reach: 'One honest sentence to one person is within reach. It does not have to settle everything.',
    reframes: ['I do not have to be perfect to be loved.', 'Someone’s silence is not a verdict on me.', 'I can ask instead of assuming.'],
    emotions: { calm: 1, gratitude: 0.7 }, features: [['lanterns', 0.9], ['puffs', 1], ['butterflies', 0.7], ['warmBlooms', 0.7]] },
  { re: /money|rent|debt|bills?|afford|loan|salary|broke|financ|pay(ing|ment)?|mortgage/,
    name: 'The Even Ground', ack: 'Money worries sit in the body. It makes sense that this one is hard to put down.',
    belief: 'If I am struggling with this, I have failed at being a capable person.',
    known: 'The numbers are real, and they are also specific. A specific problem can be worked on piece by piece.',
    friend: 'A friend would say: money trouble is a situation you are in, not a measure of who you are.',
    reach: 'One number, one call, or one list is within reach today. Looking at it clearly often shrinks it a little.',
    reframes: ['My circumstances are not my character.', 'I can face one piece of this at a time.', 'Asking for help with this is a capable thing to do.'],
    emotions: { calm: 1, courage: 0.4, hope: 0.5 }, features: [['mountains', 0.3], ['path', 0.8], ['door', 0], ['mushrooms', 0], ['fireflies', 0.6], ['lanterns', 0.5]] },
  { re: /health|sick|ill(ness)?|doctor|pain|symptom|diagnos|my body|sleep|insomnia|tired|hospital|results|surgery|panic|anxiety attack/,
    name: 'The Resting Place', ack: 'Worry about a body, yours or someone else’s, is a way of caring. It is allowed to be scary.',
    belief: 'If I stop watching for danger, something terrible will happen.',
    known: 'What you know for certain is smaller than what you are afraid of. The rest is waiting, and waiting is the hard part.',
    friend: 'A friend would say: you do not have to carry this alone, or figure it all out tonight.',
    reach: 'One caring thing is within reach. A question written down for a doctor, a glass of water, or rest.',
    reframes: ['I can care for my body without standing guard every minute.', 'Not knowing yet is not bad news.', 'I am allowed to rest while I wait.'],
    emotions: { calm: 1, hope: 0.5 }, features: [['mist', 0.6], ['moon', 0.8], ['koi', 1], ['lanterns', 0.6], ['fireflies', 0.5]] },
  { re: /too much|overwhelm|busy|behind|everything|so many|keep up|stress|burn(ed|t)? ?out|exhaust|pressure|to-?do|no time/,
    name: 'The Clearing', ack: 'That is a lot to be holding at once. No wonder it feels like too much.',
    belief: 'I have to hold everything together, and if I drop anything I have failed.',
    known: 'Everything is not due at the same moment, even though it arrives in your mind that way.',
    friend: 'A friend would say: you are one person. Put some of it down. The world will keep turning.',
    reach: 'Pick the one thing that would make today lighter. The rest can wait its turn.',
    reframes: ['I can do one thing at a time.', 'Resting is part of the work, not a failure of it.', 'Not everything has to be held by me.'],
    emotions: { calm: 1, joy: 0.3 }, features: [['mist', 0.4], ['petals', 0.6], ['koi', 0.8], ['clouds', 0.2], ['puffs', 0.7]] },
  { re: /future|what if|uncertain|do(n'?t| not) know|decision|decide|choice|chang|mov(e|ing)|next year|plan|unknown|lost|direction|purpose|scared|afraid/,
    name: 'The Path One Stone Long', ack: 'Not knowing is uncomfortable. The mind tries to help by imagining every ending at once.',
    belief: 'I need to know how it turns out before I can be okay.',
    known: 'Today is known. The future you are picturing is one of many drafts, and none of them is written yet.',
    friend: 'A friend would say: you have never had the whole map, and you still found your way to here.',
    reach: 'You only need the next step, not the whole path. What is the smallest one you can see from here?',
    reframes: ['I can take the next step without seeing the whole road.', 'Not knowing is not the same as something being wrong.', 'I have handled uncertain things before.'],
    emotions: { calm: 1, curiosity: 0.45, hope: 0.5 }, features: [['path', 1], ['door', 0], ['mushrooms', 0.4], ['stars', 0.8], ['fireflies', 0.8], ['floaters', 0]] },
];
const DEFAULT: Theme = {
  re: /./, name: 'Where It Was Set Down', ack: 'Thank you for setting this down. It does not have to be solved to be put down for a while.',
  belief: 'If I keep worrying about this, I will be ready when it happens.',
  known: 'Some of this is happening now and some of it is a story about later. Only the first part needs you today.',
  friend: 'A friend would say: of course you feel this way. And you are doing better than the worry tells you.',
  reach: 'One small thing is within reach. You do not have to see the end to take it.',
  reframes: ['I can loosen my grip on this and still care about it.', 'A thought is not a prediction.', 'I have come through hard things before.'],
  emotions: { calm: 1, hope: 0.5 }, features: [['lanterns', 0.8], ['fireflies', 0.7], ['koi', 0.8], ['stars', 0.5]],
};

const clean = (s: unknown, max: number) => (typeof s === 'string' ? s.replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max) : '');

export function composeWorryLocally(worry: string): WorrySpec {
  const w = worry.toLowerCase(), th = THEMES.find(t => t.re.test(w)) ?? DEFAULT;
  return {
    worry, by: 'local', acknowledge: th.ack, belief: th.belief,
    petals: [th.known, th.friend, th.reach].map((text, i) => ({ label: PETAL_LABELS[i], text })),
    reframes: th.reframes,
    scene: { name: th.name, whisper: th.ack, emotions: th.emotions, features: th.features.map(([key, amount]) => ({ key, amount })) },
  };
}

/** Untrusted model output -> a WorrySpec, with every gap filled from the local library. */
export function validateWorry(raw: any, worry: string, by: Composer): WorrySpec | 'crisis' {
  const base = composeWorryLocally(worry);
  if (!raw || typeof raw !== 'object') return base;
  if (raw.crisis === true) return 'crisis';
  const texts = [clean(raw.known, 240), clean(raw.friend, 240), clean(raw.reach, 240)];
  const reframes = (Array.isArray(raw.reframes) ? raw.reframes : []).map((r: unknown) => clean(r, 110)).filter(Boolean).slice(0, 3);
  const scene = validateSpec(raw.scene)?.spec;
  if (scene) { // whatever was asked for, the answer to a worry is never a storm
    scene.features = (scene.features ?? []).filter(f => f.key !== 'storm').map(f => (f.key === 'rain' ? { ...f, amount: Math.min(f.amount, 0.4) } : f));
    scene.features.push({ key: 'storm', amount: 0 });
  }
  return {
    worry, by,
    acknowledge: clean(raw.acknowledge, 200) || base.acknowledge,
    belief: clean(raw.belief, 140) || base.belief,
    petals: texts.map((t, i) => ({ label: PETAL_LABELS[i], text: t || base.petals[i].text })),
    reframes: reframes.length >= 2 ? reframes : base.reframes,
    scene: scene ?? base.scene,
  };
}

export async function composeWorry(worry: string): Promise<WorrySpec | 'crisis'> {
  const text = worry.trim().slice(0, 400);
  if (CRISIS.test(text)) return 'crisis';
  const by = currentComposer();
  if (by === 'local') return composeWorryLocally(text);
  const raw = await askModel('/api/worry', { worry: text }, `${WORRY_SYSTEM}\n\nWhat they set down: "${text}"`);
  return raw ? validateWorry(raw, text, by) : composeWorryLocally(text);
}
