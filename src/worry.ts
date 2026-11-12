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
import { WORRY_SYSTEM, RETHINK_SYSTEM } from '../shared/prompts.mjs';

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
  { re: /fail|presentation|exam\b|\btest\b|interview|deadline|mistake|mess(ed)? up|perform|\bboss|job|work|career|promotion|review|grade|school|project/,
    name: 'The Unhurried Evening', ack: 'Of course this feels heavy. It matters to you, and that is why it is loud.',
    belief: 'If I get this wrong, it will prove I am not good enough.',
    known: 'The outcome has not happened yet. What exists right now is preparation, and a mind rehearsing the worst version.',
    friend: 'A friend would say: you have got through hard things before, and one result has never been the whole of you.',
    reach: 'One small piece is within reach today. Fifteen minutes on the very next step is enough to begin.',
    reframes: ['My worth is not decided by one result.', 'I can be nervous and still do this well enough.', 'A mistake is something that happens, not something I am.'],
    emotions: { calm: 1, hope: 0.7 }, features: [['lanterns', 0.7], ['hopeSprouts', 0.9], ['rainbow', 0.2], ['fireflies', 0.5]] },
  { re: /friend|partner|boyfriend|girlfriend|husband|wife|relationship|lonely|alone|reject|broke up with me|dumped|left me for|leave me|left me|ignor|texts?( me)? back|text(ed)?( me)? back|never (replies|answers|calls|writes)|ghost|likes? me|hates? me|judg|think of me|embarrass|awkward|family|mother|father|mom|dad/,
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
    emotions: { calm: 1, hope: 0.8 }, features: [['path', 0.8], ['door', 0], ['mushrooms', 0], ['fireflies', 0.6], ['lanterns', 0.5]] },
  { re: /health|sick|\bill\b|illness|unwell|doctor|pain|symptom|diagnos|my body|sleep|insomnia|tired|hospital|results|surgery|panic|anxiety attack|cancer|chemo|tumou?r|covid|flu\b|fever|injur|accident|recover|treatment|scan|dying|old age|getting old|vet\b/,
    name: 'The Resting Place', ack: 'Worry about a body, yours or someone else’s, is a way of caring. It is allowed to be scary.',
    belief: 'If I stop watching for danger, something terrible will happen.',
    known: 'What you know for certain is smaller than what you are afraid of. The rest is waiting, and waiting is the hard part.',
    friend: 'A friend would say: you do not have to carry this alone, or figure it all out tonight.',
    reach: 'One caring thing is within reach. A question written down for a doctor, a glass of water, or rest.',
    reframes: ['I can care for my body without standing guard every minute.', 'Not knowing yet is not bad news.', 'I am allowed to rest while I wait.'],
    emotions: { calm: 1, hope: 0.5 }, features: [['mist', 0.6], ['moon', 0.8], ['koi', 1], ['lanterns', 0.6], ['fireflies', 0.5]] },
  { re: /prepar|get ready|ready in time|not ready|too much|so much|a lot to do|lots to do|can'?t cope|overwhelm|busy|behind|everything|so many|keep up|stress|burn(ed|t)? ?out|exhaust|pressure|to-?do|no time/,
    name: 'The Clearing', ack: 'That is a lot to be holding at once. No wonder it feels like too much.',
    belief: 'I have to hold everything together, and if I drop anything I have failed.',
    known: 'Everything is not due at the same moment, even though it arrives in your mind that way.',
    friend: 'A friend would say: you are one person. Put some of it down. The world will keep turning.',
    reach: 'Pick the one thing that would make today lighter. The rest can wait its turn.',
    reframes: ['I can do one thing at a time.', 'Resting is part of the work, not a failure of it.', 'Not everything has to be held by me.'],
    emotions: { calm: 1, joy: 0.3 }, features: [['mist', 0.4], ['petals', 0.6], ['koi', 0.8], ['clouds', 0.2], ['puffs', 0.7]] },
  { re: /turn out|how it (will )?go|outcome|future|what if|uncertain|do(n'?t| not) know|decision|decide|choice|chang|mov(e|ing)|next year|plan|unknown|lost|direction|purpose|scared|afraid/,
    name: 'The Path One Stone Long', ack: 'Not knowing is uncomfortable. The mind tries to help by imagining every ending at once.',
    belief: 'I need to know how it turns out before I can be okay.',
    known: 'Today is known. The future you are picturing is one of many drafts, and none of them is written yet.',
    friend: 'A friend would say: you have never had the whole map, and you still found your way to here.',
    reach: 'You only need the next step, not the whole path. What is the smallest one you can see from here?',
    reframes: ['I can take the next step without seeing the whole road.', 'Not knowing is not the same as something being wrong.', 'I have handled uncertain things before.'],
    emotions: { calm: 1, curiosity: 0.45, hope: 0.5 }, features: [['path', 1], ['door', 0], ['mushrooms', 0.4], ['stars', 0.8], ['fireflies', 0.8], ['floaters', 0]] },
];
const CONFLICT: Theme = {
  re: /fight|fought|argu|angry with|mad at|upset with|said something|hurt (their|his|her|my) feelings|not speaking|falling out|fell out|disagree|\b(i|we) (yelled|shouted|snapped|screamed|lost my temper|lost it)/,
  name: 'The Mending Bridge', ack: 'A falling-out stays with you. It is hard to put down while it still feels unsettled.',
  belief: 'If we clash, it means something between us is broken for good.',
  known: 'One hard moment happened. It is part of the story between you, not the whole of it.',
  friend: 'A friend would say: one hard moment rarely decides everything between two people.',
  reach: 'If and when you want to, one small step is within reach. Even a single honest sentence.',
  reframes: ['One hard conversation does not decide everything.', 'I can let it settle before I decide what to do.', 'I can take a small step toward repair, if I choose to.'],
  emotions: { calm: 1, hope: 0.6, gratitude: 0.4 }, features: [['path', 0.7], ['door', 0], ['mushrooms', 0], ['lanterns', 0.6], ['fireflies', 0.6], ['rainbow', 0.2]],
};
THEMES.push(CONFLICT);
/** someone treated them badly: this is not a disagreement, and it is not theirs to repair */
const MISTREATED: Theme = {
  re: /(yell|shout|scream|snapp?|swore|swear|curs)(ed|ing|s)? (at|to) me|(yell|shout|scream)(ed|ing)? in my face|(was|were|is|are|being|been) (rude|mean|cruel|nasty|harsh|aggressive|horrible|awful) (to|with) me|insult|humiliat|belittl|demean|bull(y|ied|ies|ying)|harass|talk(ed|s|ing)? down to me|put(s|ting)? me down|made fun of me|mock(ed|ing)? me|blam(ed|es|ing) me|(criticis|criticiz)(ed|es|ing) me|called me (a|an|stupid|useless|lazy)|treated me (badly|like)|disrespect/,
  name: 'The Quiet Shelter', ack: 'Being treated that way is upsetting. It makes sense that it is still with you.',
  belief: 'If they treated me that way, I must have deserved it.',
  known: 'How someone speaks to you says more about them in that moment than about your worth. You did not deserve to be treated that way.',
  friend: 'A friend would say: that was not okay, and you are allowed to feel shaken by it.',
  reach: 'One thing is within reach: tell someone you trust what happened, or write it down while it is fresh.',
  reframes: ['How they treated me is not a measure of my worth.', 'I can take this seriously without blaming myself.', 'I deserve to be spoken to with respect.'],
  emotions: { calm: 1, hope: 0.5, gratitude: 0.3 }, features: [['lanterns', 0.7], ['fireflies', 0.6], ['puffs', 0.6], ['koi', 0.6], ['rain', 0]],
};
THEMES.push(MISTREATED);
/** being looked at: presentations, crowds, the fear of being judged */
const JUDGED: Theme = {
  re: /being seen|seen by|look(ed)? at|in front of|judg|embarrass|look (stupid|foolish|silly)|laugh at|what (they|people|others|everyone) (will )?think|audience|stage|blush/,
  name: 'The Kind Audience', ack: 'Being looked at can feel like standing in a bright light. Of course it makes you want to hide a little.',
  belief: 'If they see me stumble, they will think less of me.',
  known: 'You know how it feels from the inside. What they will think is a guess, and most people are busy with their own nerves.',
  friend: 'A friend would say: the people who matter are rooting for you, not grading you.',
  reach: 'One thing is within reach: find one friendly face, and speak to them.',
  reframes: ['People are kinder watchers than my nerves say.', 'I can be seen and still be okay.', 'One stumble is not what people remember.'],
  emotions: { calm: 1, hope: 0.6, gratitude: 0.3 }, features: [['lanterns', 0.8], ['fireflies', 0.6], ['puffs', 0.8], ['rain', 0]],
};
THEMES.push(JUDGED);
const OTHER_PART = /something else/i;

/** what someone might choose from when asked "What part of this is weighing on you?" */
const PARTS: Record<string, string[]> = {
  'The Lantern Water': ['missing them', 'things left unsaid', 'going on without them'],
  'The Garden As It Is': ['how I see myself', 'what others might think', 'something I did'],
  'The Unhurried Evening': ['the preparation', 'being seen', 'how it will turn out'],
  'The Shore of Kept Company': ['what they think of me', 'losing them', 'not knowing where I stand'],
  'The Even Ground': ['the next bill', 'feeling behind', 'what it says about me'],
  'The Resting Place': ['not knowing yet', 'how my body feels', 'what might change'],
  'The Clearing': ['how much there is', 'where to start', 'never getting a break'],
  'The Path One Stone Long': ['making the wrong choice', 'not knowing yet', 'being left behind'],
  'The Mending Bridge': ['what was said', 'whether we will be okay', 'what to do next'],
  'The Quiet Shelter': ['how they spoke to me', 'whether it was my fault', 'facing them again'],
  'The Watchful Lantern': ['not being able to help', 'not knowing what happens', 'how they are feeling'],
  'The Shared Lantern': ['not being able to fix it', 'how they are feeling', 'what it means for us'],
  'The Kind Audience': ['what people will think', 'making a mistake in front of them', 'being looked at'],
  'Where It Was Set Down': ['what might happen', 'how it makes me feel', 'something I cannot name'],
};
export function worryParts(worry: string): string[] { return [...(PARTS[pickTheme(worry).name] ?? PARTS['Where It Was Set Down']), 'something else entirely']; }
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

/* ---------- when the worry is about someone else ---------- */
const WHO = /\b(my|our)\s+(best friend|friends?|mom|mum|mother|dad|father|parents?|sister|brother|sons?|daughters?|kids?|children|child|baby|partner|husband|wife|boyfriend|girlfriend|fianc[eé]e?|grand(?:ma|mother|pa|father|parents?)|aunt|uncle|cousin|dog|cat|pet|colleague|co-?worker|boss|teammate|roommate|neighbou?r|family)\b/i;
type Words = Omit<Theme, 're'>;
const OTHER_HEALTH = (mine: string, yours: string): Words => ({
  name: 'The Watchful Lantern', ack: `Worrying about ${yours} is love with nowhere to go. Of course it feels heavy.`,
  belief: `If I can't make this better for ${mine}, I'm not doing enough.`,
  known: 'What you know is what is happening now. How it unfolds isn\'t written yet, and worry fills that gap with the hardest version.',
  friend: 'A friend would say: you do not have to fix this to help. Being there is the help.',
  reach: `One small kindness is within reach today: a message, a visit, or asking ${yours} what would actually help.`,
  reframes: [`I can't control how this goes for ${mine}, but I can be there.`, `Caring for ${mine} includes caring for myself.`, 'I do not have to carry this worry alone.'],
  emotions: { calm: 1, gratitude: 0.6, hope: 0.5 }, features: [['lanterns', 0.9], ['fireflies', 0.7], ['hopeSprouts', 0.6], ['moon', 0.6], ['rain', 0]],
});
const OTHER = (mine: string, yours: string, are = 'is'): Words => ({
  name: 'The Shared Lantern', ack: `It is hard to watch ${yours} go through something. Caring this much says a lot about you.`,
  belief: `It's my job to make sure ${mine} ${are} okay.`,
  known: `You are walking beside ${yours}, not in their place. Some of this is yours to help with, and some of it isn't.`,
  friend: `A friend would say: you can love ${yours} without carrying all of it for them.`,
  reach: `One thing is within reach: let ${yours} know you are there, and ask what would help.`,
  reframes: [`I can support ${mine} without fixing everything.`, 'Being there is enough, even when I cannot solve it.', 'My care counts, even from the side.'],
  emotions: { calm: 1, gratitude: 0.7, hope: 0.4 }, features: [['lanterns', 0.8], ['fireflies', 0.6], ['butterflies', 0.5], ['koi', 0.6]],
});

/** score every theme by how much of it the words contain, instead of taking the first keyword that matches */
function bestTheme(text: string): Theme | null {
  let best: Theme | null = null, top = 0;
  for (const th of THEMES) { const n = (text.match(new RegExp(th.re.source, 'gi')) ?? []).length; if (n > top) { top = n; best = th; } }
  return best;
}

/** read a worry the way the garden's own words understand it */
function pickTheme(worry: string): Words {
  // "sick and tired of" is weariness, not illness
  const w = worry.toLowerCase().replace(/sick (and|&) tired( of)?|sick of|tired of|fed up/g, 'too much'), who = w.match(WHO);
  const grief = THEMES[0];
  let th: Words;
  if (grief.re.test(w)) th = grief; // missing someone who is gone always reads as grief, whoever it is
  else if (MISTREATED.re.test(w)) th = MISTREATED; // being yelled at is not a disagreement: say so first, whoever did it
  else if (CONFLICT.re.test(w)) th = CONFLICT;
  else if (who) {
    // read the worry with "my friend" taken out, so the person it is about doesn't decide the topic
    const mine = `${who[1]} ${who[2]}`, yours = `${who[1] === 'our' ? 'your' : 'your'} ${who[2]}`;
    const topic = bestTheme(w.replace(WHO, ' '));
    const health = THEMES.find(t => t.name === 'The Resting Place'), close = THEMES.find(t => t.name === 'The Shore of Kept Company');
    // the closeness theme only fits when it is about how they treat *you* ("ignored me"), not about their own trouble
    th = topic === health ? OTHER_HEALTH(mine, yours) : topic === close && /\b(me|us)\b/.test(w) ? close! : OTHER(mine, yours, /(s|children)$/.test(who[2]) ? 'are' : 'is');
  } else th = bestTheme(w) ?? DEFAULT;
  return th;
}

/** the garden's own words; when the person has said which part weighs most, that part leads */
export function composeWorryLocally(worry: string, part?: string): WorrySpec {
  const base = pickTheme(worry), p = part?.trim().toLowerCase();
  const th: Words = p && !OTHER_PART.test(p) ? (bestTheme(p.replace(/sick (and|&) tired( of)?|sick of|tired of|fed up/g, 'too much')) ?? base) : base;
  return {
    worry, by: 'local', acknowledge: th.ack, belief: th.belief,
    petals: [th.known, th.friend, th.reach].map((text, i) => ({ label: PETAL_LABELS[i], text })),
    reframes: th.reframes,
    scene: { name: th.name, whisper: th.ack, emotions: th.emotions, features: th.features.map(([key, amount]) => ({ key, amount })) },
  };
}

/** Untrusted model output -> a WorrySpec, with every gap filled from the local library. */
export function validateWorry(raw: any, worry: string, by: Composer, part?: string): WorrySpec | 'crisis' {
  const base = composeWorryLocally(worry, part);
  if (!raw || typeof raw !== 'object') return base;
  if (raw.crisis === true) return 'crisis';
  const texts = [clean(raw.known, 240), clean(raw.friend, 240), clean(raw.reach, 240)];
  const reframes = (Array.isArray(raw.reframes) ? raw.reframes : []).map((r: unknown) => clean(r, 110)).filter(Boolean).slice(0, 3);
  const scene = validateSpec(raw.scene)?.spec;
  if (scene) {
    // a worry is answered with hope, never with anger (the old "courage" material) or fear
    const e = scene.emotions, moved = (e.courage ?? 0) + (e.fear ?? 0);
    if (moved) { delete e.courage; delete e.fear; e.hope = Math.min(1, (e.hope ?? 0) + moved); } // whatever was asked for, the answer to a worry is never a storm
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

export async function composeWorry(worry: string, part?: string): Promise<WorrySpec | 'crisis'> {
  const text = worry.trim().slice(0, 400), said = part?.trim().slice(0, 240);
  if (CRISIS.test(text) || (said && CRISIS.test(said))) return 'crisis';
  const by = currentComposer();
  if (by === 'local') return composeWorryLocally(text, said);
  const prompt = `${WORRY_SYSTEM}\n\nWhat they set down: "${text}"` + (said ? `\n\nAsked "What part of this is weighing on you?", they said: "${said}". Let that part lead everything you write.` : '');
  const raw = await askModel('/api/worry', { worry: text, part: said }, prompt);
  return raw ? validateWorry(raw, text, by, said) : composeWorryLocally(text, said);
}

/* ---------- "not quite": another way of seeing one bud ---------- */
const OTHER_VIEWS: string[][] = [
  ['Right now this is a thought about what might happen. It has not happened, and a thought is not a forecast.',
    'The facts you have are fewer than the fears. It is all right to stay with only the facts for a moment.',
    'What is certain right now: you noticed this, you named it, and you set it down. That is already something.',
    'Feelings are real information about what matters to you. They are not always accurate about what will happen.'],
  ['A friend would say: I can see how much this matters to you, and I am not going anywhere.',
    'A friend would say: you are being harder on yourself than you would ever be on me.',
    'A friend would say: you do not have to have this figured out to deserve some rest tonight.',
    'A friend would say: tell me about it. You do not have to carry it in silence.'],
  ['Nothing needs to be solved right now. One slow breath, in for four and out for six, is enough for this moment.',
    'Write the worry down in one sentence, then close the page. It will keep until you choose to look again.',
    'Tell one person you trust a little of this. Carried with someone, it weighs less.',
    'Do one kind, ordinary thing for yourself in the next hour: water, a walk, a warm drink, an early night.'],
];
/** one bud said differently; never repeats what the person has already been shown */
export async function rethinkPetal(w: WorrySpec & { part?: string }, i: number, seen: string[]): Promise<string> {
  const local = () => OTHER_VIEWS[i].find(t => !seen.includes(t)) ?? OTHER_VIEWS[i][(seen.length) % OTHER_VIEWS[i].length];
  if (currentComposer() === 'local') return local();
  const label = PETAL_LABELS[i];
  const prompt = `${RETHINK_SYSTEM}\n\nWhat they set down: "${w.worry}"` + (w.part ? `\nThe part weighing on them most: "${w.part}"` : '') +
    `\nThe view: "${label}"\nWhat they were shown, which did not fit:\n${seen.map(t => `- ${t}`).join('\n')}`;
  const raw = await askModel('/api/rethink', { worry: w.worry, part: w.part, label, seen }, prompt);
  let text = clean(raw?.text, 220);
  if (i === 1 && text && !/^a friend would say/i.test(text)) text = 'A friend would say: ' + text;
  if (!text || seen.includes(text) || CRISIS.test(text)) return local();
  return text;
}
