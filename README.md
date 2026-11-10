# Aha — an interactive personal growth playground

*Experience first. Discover the insight afterward.*

Aha is a mobile-first web app where you play with ideas from psychology, communication and
money in 3–5 minute interactive experiences. The principle behind each one is revealed only
after you've played.

| Experience | Engine | What you do |
| --- | --- | --- |
| **The Conversation Game** | Branching dialogue | Text with Noor after cancelling on her. Her face, mood and a connection meter react to every reply. Four endings, rewind any choice. |
| **The Money Playground** | Simulation | Guess, then drag sliders to test your guess. Break the model in a sandbox, roll random futures. |
| **Trick Your Brain** | Predict and reveal | Three bias challenges. Commit to an answer, see the result, replay with the alternative version and compare. |

## Two ways to play

Home has a **Story / Tap** switch (remembered per browser). Both modes run on the same
experience data.

- **Story** (`/watch/[id]`, default): plays like a short vertical video. Scenes advance on
  their own with a segmented progress bar and animated captions; tap to skip ahead, hold
  anywhere to pause;
  an optional voice reads lines aloud. You join in with gestures instead of buttons:
  swipe a deck of replies and flick one up to send, pull down to take a choice back,
  swipe up/down or left/right to decide, drag to grow a tree or raise a savings line and
  hold still to lock it in, drag sideways to scrub time. Arrow keys and Enter do the same
  on a keyboard. Every gesture also has a tap equivalent (tap a reply card, tap a choice,
  tap to lock a value, or use the Skip chip).
- **Tap** (`/play/[id]`): the original tap-through version, with extras the story mode
  leaves out (write-your-own replies with AI, the money sandbox, replay-and-compare in
  the bias challenges).

## Run it

Requires Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:3000
```

Production: `npm run build && npm start`.

The app is fully playable with **no configuration** (demo mode).

## Environment variables

Copy `.env.example` to `.env.local` and add one key to switch on live AI.

| Variable | Purpose | Default |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | Enables AI via Anthropic | unset |
| `ANTHROPIC_MODEL` | Anthropic model id | `claude-sonnet-5-5` |
| `OPENAI_API_KEY` | Enables AI via OpenAI | unset |
| `OPENAI_MODEL` | OpenAI model id | `gpt-4o-mini` |
| `AI_PROVIDER` | `anthropic` or `openai`, when both keys are set | Anthropic first |
| `ANTHROPIC_BASE_URL`, `OPENAI_BASE_URL` | Optional proxy / gateway | official APIs |

Keys are read only on the server and never reach the browser.

## What AI does (and doesn't)

| | No key (demo mode) | With a key |
| --- | --- | --- |
| Conversation Game replies | Authored branching dialogue | Noor's reactions are AI-voiced and marked as such |
| "Write your own" reply | Hidden | You type freely; AI maps your message onto one of the authored moves and replies in character |
| Money Playground, Trick Your Brain | Deterministic | Deterministic (no AI needed) |
| Deep-dive lessons | Pre-written feedback | Personal AI feedback and alternative explanations |

Guardrails: the dialogue graph, mood changes, meter effects and endings always come from
authored data. The model only words a reply for a branch that already exists, and any
option id it returns is validated against the current node. On any AI error the authored
line is used.

## Architecture: engines and content are separate

```
src/
  experiences/
    types.ts              Content model: DialogueScenario, SavingsSimulation, ChallengeSet
    content/*.ts          The three experiences as structured data
    index.ts              Registry
  components/play/        Reusable engines (no experience-specific copy)
    PlayShell.tsx         Themed full-screen frame, Home button, progress pips, confetti
    DialoguePlayer.tsx    Branching dialogue + choices + rewind + endings
    Face.tsx              Expressive character avatar driven by a mood value
    SimulationPlayer.tsx  Guess → test → sandbox flow for the savings model
    sim.tsx               Slider, animated projection chart, animated numbers, model maths
    ChallengePlayer.tsx   Predict-and-reveal engine (anchor, frame, sequence challenges)
    InsightReveal.tsx     Shared payoff screen: insight, why, sources, save, replay
    CardArt.tsx           Home card illustrations
  components/story/       Story (video-style) engine
    StoryStage.tsx        Vertical stage: timed beats, progress segments, hold to pause, voice
    gestures.tsx          ReplyDeck (swipe + flick), SwipeChoice, DragValue (drag + hold to lock)
    ConversationStory.tsx, MoneyStory.tsx, BrainStory.tsx
  app/
    page.tsx              Discovery Home
    watch/[id]/           Story-mode route
    play/[id]/            Tap-mode route
    collection/           Saved insights, endings found, deep dives, reset
    lesson/[id]/          Optional 5-minute deep-dive reads (the original 18 lessons)
    api/ai/               dialogue, feedback, explain, status
  lib/
    store.tsx             Progress in localStorage (key: aha:v2)
    recommend.ts          Picks the featured experience
    ai/                   Provider abstraction (Anthropic, OpenAI) and prompts
  content/                The original curated lesson library (supporting knowledge)
```

### Adding content

- **A new conversation:** add a `DialogueScenario` data file (nodes, options, reactions,
  endings, moves) and register it in `experiences/index.ts`. No UI changes.
- **A new bias challenge:** add an entry to a `ChallengeSet` using an existing kind
  (`anchor`, `frame`, `sequence`).
- **A new kind of challenge or simulation model** needs a small renderer in the matching
  engine.

## Notes and limits

- Progress lives only in the browser. "Start over" in the collection clears it.
- Research figures (anchoring averages, framing rates, tree height) are cited from the
  named studies and should be checked editorially before a public launch.
- The Money Playground is a simplified model with its assumptions listed in-app. It is not
  financial advice.
- Story mode uses animated scenes built in code, not filmed or generated video footage.
  The voice uses the browser's built-in speech synthesis, so it varies by device.
- Analytics are not instrumented yet.
