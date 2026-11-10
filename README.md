# Aha — AI Personal Growth Companion (MVP v0.1)

*A little more insight. A better version of you.*

Aha is a mobile-first web app for exploring ideas about relationships, psychology, money,
career, creativity, and habits in five-minute interactive lessons. Lesson content is curated;
AI personalises how you encounter, understand, and apply it.

## Run it

Requires Node.js 20+.

```bash
npm install
npm run dev        # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

The app is fully usable with **no configuration**. Without an API key it runs in *demo mode*
(see below).

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

Keys are read only on the server (`src/lib/ai/provider.ts`) and never reach the browser.

## Demo mode vs live AI

| Feature | No key (demo mode) | With a key |
| --- | --- | --- |
| Journey generation | Deterministic scoring on topics, motivation, goal keywords | Model picks 5 lessons and writes reasons; every id is validated against the catalog and topped up by the deterministic logic if needed |
| Scenario / thought-experiment feedback | Pre-authored per option | Pre-authored per option (curated on purpose) |
| Written reflections and practice | Pre-authored reflection | Personal AI response |
| "Explain this differently" | Editor-written alternative analogy | Fresh AI analogy grounded in the lesson |

Every piece of text is labelled: **AI response**, **Pre-written · demo mode**, or
**Curated feedback**. Sources appear in their own section at the end of each lesson and are
never mixed with AI output. If an AI call fails, the app silently falls back to the
pre-written content. My Growth shows which mode is active.

## Project structure

```
src/
  content/              Curated library (no UI code)
    topics.ts           6 topics + onboarding motivations
    lessons/*.ts        18 lessons, 3 per topic
  lib/
    types.ts            Topic, Lesson, UserProfile, LearningJourney, UserProgress
    journey.ts          Deterministic journey generator + validation of AI output
    recommend.ts        Today's insight / discovery picks
    store.tsx           App state, persisted to localStorage (key: aha:v1)
    api.ts              Client helpers with local fallbacks
    ai/provider.ts      AIProvider abstraction (Anthropic, OpenAI)
    ai/prompts.ts       Prompts and guardrails
  app/
    page.tsx            Welcome + onboarding
    journey/            Personalised journey with "why this one"
    home/ explore/ growth/
    lesson/[id]/        Lesson player
    api/ai/             journey, feedback, explain, status
  components/           UI kit, cards, shell, lesson player, exercises
```

### Adding a lesson

Add a `Lesson` object to a file in `src/content/lessons/`. It is picked up everywhere
automatically. Exercise types: `scenario`, `thought-experiment`, `perspectives`,
`reflection`, `practice`, `selection`, `simulator`. Per-option feedback lives on each
exercise option; `feedbackGuidance` steers AI feedback and is never shown to users.

### Adding an AI provider

Implement the `AIProvider` interface in `src/lib/ai/provider.ts` and return it from
`getProvider()`. Nothing else changes.

## Notes and limits

- User data lives only in the browser's localStorage. "Start over" in My Growth clears it.
- Sources are real works cited by title and author. Lessons paraphrase ideas and contain no
  quotations, links, or page numbers. Review citations editorially before a public launch.
- Analytics for the brief's success metrics are not instrumented yet; `interactionHistory`,
  `lessonFeedback`, and `reportedExperiments` in the store hold the raw signals.
- Out of scope for v0.1: accounts, payments, social features, notifications.
