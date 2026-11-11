# Expanse: The Emotion Garden

A small living world that is built out of emotions. There is no dashboard: the
garden is the whole product. Emotion seeds rest on a mossy ledge at the front
of the scene; you carry one into the ground and the world transforms outward
from the spot where it lands. Plant a second and the two mix into something
neither would make alone.

The eight seeds are Joy, Calm, Sadness, Anger, Fear, Love, Wonder and Hope.
In the code, Wonder, Anger and Love keep their original keys (`curiosity`,
`courage`, `gratitude`) so gardens saved earlier keep working.

## Planting a feeling

Planting one seed is a complete visit. The seed lands, then one nearby thing
answers it (`src/garden/gesture.ts`): embers settle into stones for Anger, an
acorn lantern comes on for Fear, a flower opens and a bud leans toward it for
Joy + Hope. In a pairing, both feelings take part in one event. Only after
that answer has registered do two lines appear: the scene name and one short
sentence. Other sparkle and invitations step back while it plays. A few words
can be added afterwards, typed or spoken, and are kept beside the seed.

Sublines marked `source: 'review'` in `SPECS` are the reviewed copy; those
marked `'draft'` follow the same pattern and are ready to be replaced.

## Run it

```bash
npm install
npm run dev          # http://localhost:5173, hot reload
```

Production build (one self-contained `dist/index.html`, hostable anywhere):

```bash
npm run build
npm start            # http://localhost:8787, serves dist/ + the optional AI endpoint
```

AI wishes are optional. With no key the garden composes wishes on the device.
To let Claude compose them, start the server with a key:

```bash
ANTHROPIC_API_KEY=sk-ant-... npm start
```

## How the world is built

```
src/world/scene.ts     the model: emotions, features, the 21 mixes, validation
src/garden/garden.ts   the garden: simulation, painting, seed physics, input
src/garden/art.ts      component art: glows, the 8 seeds, the 15 keepsakes
src/garden/overlays.ts hidden worlds (door / lake / mountain) and the constellation sky
src/ai.ts              wish composers: server -> hosted Claude -> on-device
src/worry.ts           worries: validation, crisis check, on-device theme library
shared/prompts.mjs     the worry prompt, shared by the page and the server
src/audio.ts           generative soundscape (WebAudio, no files)
src/store.ts           localStorage persistence
server/server.mjs      optional static server + POST /api/wish (Claude)
```

**A scene is only numbers.** `Scene` = 8 palette colours + 35 feature amounts
in 0..1 (rain, mountains, lake, door, lanterns, tree gold, ...). Each emotion
contributes a partial scene. A mix blends the two contributions and then
applies a hand-written recipe that adds the surprise (a door under the lake,
string lights, an aurora). Because scenes are numeric, the renderer can glide
between any two of them, which is what makes the transformation feel physical
instead of a cut.

**Two layers.**
- *Emotional weather* (temporary): the displayed scene eases toward the target
  scene. Sky, light, weather, creatures, the great tree and magical objects all
  read their amount from it.
- *Personal garden* (permanent): keepsakes, released memory lanterns and world
  dewdrops live in the save file and are painted in every weather.

**The transformation wave.** Planting records an origin. Ground things
(flowers, mushrooms, stepping stones) only start changing once an expanding
ring from that origin reaches them, so the change visibly spreads from the seed.
While a seed is being carried, the world already leans 30% toward what it would
become.

**AI composes, it never draws.** A wish returns a small JSON spec (emotion
weights, feature amounts, three sky colours, a name, one sentence).
`validateSpec` whitelists keys, clamps numbers, checks colours and repairs
impossible combinations before anything is rendered. Any failure falls back to
the on-device composer. Memory-lantern notes are never sent anywhere; the wish
line says, before you send it, whether the words stay on the device or travel
to Claude.

Rendering is Canvas 2D with parallax layers (a polished 2.5D scene rather than
a thin 3D one), no image assets, no runtime dependencies in the page.

## Interactions

Seeds
- Drag a seed from the ledge into the world. It can be dropped from the sky and
  falls to the ground beneath. A ring shows where it will land.
- While carrying: the sky leans toward the new emotion, nearby flowers bend
  toward the seed, creatures hop after it, the view scrolls at the edges.
- Two planted seeds are joined by a thread of light: that is the mix.
- Touch a sprout to lift the seed back out (undo). A third seed sends the
  oldest one home. Tapping a seed plants it without dragging.

The world
- Drag the scenery to look around.
- Flowers bloom, mushrooms bounce, creatures jump, butterflies scatter,
  floating objects spin, lanterns rise, the lake ripples, the great tree sheds
  leaves, the sky throws a shooting star.
- A hidden glimmer in every world gives a keepsake that belongs to its emotion.

Discoveries
- **The Mysterious Door** (Curiosity): a tiny world behind it with two ways on,
  each leading to a different keepsake.
- **The Door Beneath Still Water** (Calm + Curiosity): wake the shell by
  popping bubbles.
- **The Garden of Possibilities** (Hope): a lit gateway opens in the hills;
  inside, each of three lamps you light offers a possibility, and all three
  together give a keepsake.
- **The Rain Garden** (any rain): touch the rain and luminous flowers bloom
  where it lands. The fifth one leaves a Rainbloom and a seventh seed: Hope.
- **The Memory Lantern** (Calm + Gratitude): write a thought, or nothing, and
  let it rise. It stays in your sky and can be read again.
- **The Giving Tree** (Gratitude): pick the gifts.
- **The Listening Flower**: whisper a wish; it grows a wish-seed to plant.

Worries
- **Set it down.** Touch the resting stone ("set down a worry") and type or
  speak what is weighing on you. The words condense into a heavy worry stone.
- **Carry it in.** Drag the stone into the garden like a seed. The world turns
  into a calm scene composed from what you said, with one sentence that
  acknowledges it.
- **Unknot it.** The stone sits wrapped in bramble with three buds. Each opens
  into a gentler view: what is actually known, what a friend would say, what is
  within reach. Each one lets more light through the stone.
- **Choose new words.** When all three are open, touch the stone's light. It
  names the belief that may be underneath and offers three kinder ones, or you
  write your own. The one you choose grows into a Belief Bloom that stays in
  the garden; touch it any day to read it again.
- Words come from Claude when available (`shared/prompts.mjs`), otherwise from
  eight hand-written themes in `src/worry.ts`. Model output is validated and
  any missing piece is filled from the local library; the scene can never be a
  storm.
- **This is a reflective toy, not treatment.** If the words suggest someone may
  harm themselves, the garden does not play: it shows crisis-line information
  instead (`CRISIS` in `src/worry.ts`, plus a `crisis` flag from the model).
  Review that wording and the listed resources for your audience and region
  before giving this to real users.
- Voice uses the hosting page's dictation when run as a Claude artifact, or the
  browser's speech recognition otherwise. Typing always works.

Rearranging
- Press and hold almost anything, then drag: the great tree, the door (its
  stepping stones follow), the lake (its lanterns follow), the Resting Stone,
  the listening flower, any flower or mushroom, the creatures, and planted
  seeds. The arrangement is remembered. Quick taps still act and quick drags
  still pan. Things in the air and the far background do not move.

Keeping
- 24 keepsakes can be found. The hidden worlds hand out a new one each visit
  until you have them all: five in the mountain, three down each path behind
  the door, three under the lake.
- Keepsakes stay in the garden for good. Drag them anywhere. Drag one above
  the horizon to let it go.
- The dewdrop charm keeps the current sky as a World Dewdrop in the garden;
  touch it on any day to return to that world.
- The star charm: look up. Every mix you have found is a constellation; touch
  one to return to it. One undiscovered pair glows as a suggestion.
- The wind chime turns the soundscape on and off, and remembers your choice.

Sound
- Starts on your first touch (browsers do not allow audio before one); the
  wind chime switches it off and remembers that.
- No recordings and no synth chord: an outdoor soundscape modelled in
  `src/audio.ts`. A breeze that gusts and makes the leaves rustle, rain as a
  bed plus single drops on leaves and water, lake lapping and bubbles, distant
  thunder. Resident songbirds (trills, whistles, robin-like runs, call notes)
  that answer each other, a dove, faint far-off crickets, spring peepers and a green frog,
  an owl at night, a hawk over the mountains. What is present
  follows the weather of the world you planted.
- Touch: a kalimba and real wind-chime tubes tuned to the planted emotions,
  plus earth, leaf and water sounds. Planting makes whoever lives in that
  weather call out.
- Every sound has a stereo position and a distance, and shares one generated
  outdoor reverb.

Everything persists in `localStorage`. Reduced-motion preferences are
respected, and every action has a keyboard-reachable button (Tab from the top
of the page).
