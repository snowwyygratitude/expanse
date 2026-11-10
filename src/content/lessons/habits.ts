import type { Lesson } from "@/lib/types";

export const habitsLessons: Lesson[] = [
  {
    id: "willpower-isnt-enough",
    topicId: "habits",
    title: "Why Willpower Isn't Enough",
    subtitle: "What self-disciplined people actually do",
    objective:
      "Shift from trying to resist temptation in the moment to arranging things so there's less to resist.",
    centralConcept:
      "People who seem highly self-disciplined don't resist more temptation. They encounter less of it, because their habits and surroundings do the work. Changing the situation is more reliable than relying on in-the-moment willpower.",
    estimatedMinutes: 5,
    hook: {
      question: "What do very self-disciplined people do differently?",
      story: [
        "You probably know someone who seems to have endless self-control. They exercise, they don't doom-scroll, and they leave the biscuits alone.",
        "It's natural to assume they're simply better at resisting temptation than the rest of us.",
        "When researchers looked closely, they found something that surprised them.",
      ],
      cta: "See what they found",
    },
    contentBlocks: [
      {
        type: "insight",
        text: "People with strong self-control aren't better at resisting temptation. They're better at avoiding it.",
      },
      {
        type: "paragraph",
        text: "In one study, researchers pinged people throughout the day and asked what they were craving and whether they were resisting it. Those who scored highest on self-control reported fewer temptations to begin with, and less inner struggle.",
      },
      {
        type: "paragraph",
        text: "They hadn't built bigger willpower muscles. They'd built lives with less friction between themselves and what they wanted to do. Fewer battles, rather than more victories.",
      },
      {
        type: "paragraph",
        text: "Psychologist Wendy Wood, who has studied habits for decades, estimates that a large share of our daily actions are habitual: triggered by context rather than by decision. The same time, the same place, the same cue, the same response.",
      },
      {
        type: "contrast",
        left: {
          label: "Willpower plan",
          text: "Keep the phone on the bedside table and promise yourself you won't check it.",
        },
        right: {
          label: "Situation plan",
          text: "Charge the phone in the hallway. There's nothing to resist.",
        },
      },
      {
        type: "paragraph",
        text: "Willpower still has its uses, mostly for the one-off effort of setting things up. But if a plan depends on winning the same argument with yourself every evening, it's a fragile plan. Treat that as a design problem rather than a flaw in you.",
      },
    ],
    alternateExplanation:
      "Imagine two people trying to stay dry. One stands in the rain gripping an umbrella against the wind, straining every minute. The other walks under the covered arcade. From a distance the second looks effortlessly dry, as if they had some special talent. They just chose a different route. Self-control mostly looks like route selection.",
    exercise: {
      type: "scenario",
      setup:
        "It's 9pm. You wanted to read tonight, but you're on the sofa with your phone in your hand, 40 minutes into scrolling. This is the fourth night in a row. You'd like tomorrow to go differently.",
      question: "What would you change?",
      options: [
        {
          id: "a",
          text: "Promise yourself that tomorrow you'll be more disciplined.",
          feedback:
            "The intention is sincere, and it's what most of us reach for first. But tomorrow at 9pm you'll be just as tired, on the same sofa, with the same phone in reach. Nothing about the situation has changed, so the same thing is likely to happen. That's the setup, and it says nothing bad about you.",
        },
        {
          id: "b",
          text: "Leave the phone charging in another room and put the book on the sofa cushion.",
          feedback:
            "This changes the situation instead of relying on your tired evening self. The phone now takes effort and the book takes none. You may still fetch the phone sometimes, and that's fine. You've tilted the odds without needing to win an argument with yourself.",
        },
        {
          id: "c",
          text: "Delete all social apps from your phone for good.",
          feedback:
            "This definitely adds friction, and for some people a clean break works well. The trade-off is that drastic rules can be hard to live with, and one reinstall can feel like total failure. A smaller change you'll actually keep often beats a dramatic one you'll reverse.",
        },
      ],
      closing:
        "Notice which options ask more from you at 9pm, and which ask for a little effort once and then run on their own.",
    },
    feedbackGuidance:
      "Reinforce changing the situation over self-blame. Acknowledge that drastic measures work for some. Never moralize about phone use or discipline.",
    realWorldExperiment: {
      text: "Pick one small daily tug-of-war you keep losing. Tonight, change one physical thing so that tomorrow's version of you has less to resist.",
      prompt: "“Instead of resisting ___, I'll move / remove / prepare ___.”",
    },
    keyInsight: {
      headline: "Don't fight harder. Set up fewer fights.",
      text: "Self-control is less about strength in the moment and more about what you arrange beforehand.",
    },
    sources: [
      {
        title: "Everyday Temptations: An Experience Sampling Study of Desire, Conflict, and Self-Control",
        author: "Wilhelm Hofmann, Roy F. Baumeister, Georg Förster & Kathleen D. Vohs",
        kind: "Research",
        year: 2012,
        note: "Published in the Journal of Personality and Social Psychology. The study behind the finding that people high in self-control report fewer temptations.",
      },
      {
        title: "Good Habits, Bad Habits: The Science of Making Positive Changes That Stick",
        author: "Wendy Wood",
        kind: "Book",
        year: 2019,
        note: "Source of the view that much of daily behaviour is habitual and driven by context, and that friction shapes what we do.",
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
        kind: "Book",
        year: 2018,
        note: "Informs the practical emphasis on making desired behaviours easy and undesired ones harder.",
      },
    ],
    motivations: ["grow", "understand-myself", "curious"],
    keywords: ["habit", "willpower", "disciplin", "focus", "procrastinat", "phone", "self-control", "motivat", "productiv", "routine"],
    stage: "understand",
    journeyReason: "It replaces self-blame with something you can actually design.",
  },
  {
    id: "tiny-habits",
    topicId: "habits",
    title: "The Power of Tiny Habits",
    subtitle: "Start smaller than feels reasonable",
    objective:
      "Design one habit so small it's almost impossible to skip, and attach it to something you already do.",
    centralConcept:
      "Habits form through repetition in a stable context, not through intensity. Making a behaviour tiny and anchoring it to an existing routine removes the need for motivation, which is unreliable.",
    estimatedMinutes: 5,
    hook: {
      question: "Why do most big resolutions fade by February?",
      story: [
        "January: “I'm going to meditate for 30 minutes every morning.”",
        "Week one goes beautifully. Week two, you miss a day. By week four the cushion is gathering dust and you feel a bit worse about yourself than before you started.",
        "The problem wasn't your character. The plan was built on the least reliable material there is.",
      ],
      cta: "See what's sturdier",
    },
    contentBlocks: [
      {
        type: "insight",
        text: "Motivation comes and goes. A habit that only works on good days isn't a habit yet.",
      },
      {
        type: "paragraph",
        text: "Big plans are designed on our most motivated day and then have to survive our least motivated one. Stanford behaviour scientist BJ Fogg suggests turning this around: make the behaviour so small that you can do it even when you're tired, busy, or grumpy.",
      },
      {
        type: "list",
        title: "Fogg's recipe",
        items: [
          "Anchor: pick something you already do every day, like pouring your morning coffee.",
          "Tiny behaviour: add a version that takes under 30 seconds. One deep breath. Two push-ups. One sentence in a journal.",
          "Celebrate: give yourself a small internal “nice.” The good feeling is what helps wire the habit in.",
        ],
      },
      {
        type: "paragraph",
        text: "It can feel silly. Two push-ups won't change your body. But at first you're building the pattern, and fitness can come later. Once the pattern exists, it tends to grow on its own.",
      },
      {
        type: "example",
        title: "How long does it take?",
        text: "In a study led by Phillippa Lally at University College London, people took a median of 66 days for a new daily behaviour to feel automatic, with a wide range from 18 to 254 days. Missing a single day didn't derail the process.",
      },
      {
        type: "paragraph",
        text: "So the popular “21 days” figure is a myth, and perfection isn't required. What matters is showing up often enough, in the same context, with a version small enough to keep.",
      },
    ],
    alternateExplanation:
      "Think about how a path forms across a field. One person stomping through once in heavy boots leaves no trace. But light footsteps along the same line, day after day, wear a trail that eventually anyone would follow without thinking. Habits are the same: frequency along the same route matters far more than how hard you tread.",
    exercise: {
      type: "reflection",
      prompt:
        "Design your own tiny habit. Pick something you already do every day as the anchor, then add a behaviour that takes less than 30 seconds.",
      helper: "Use the shape: “After I [existing routine], I will [tiny behaviour].”",
      placeholder: "After I…, I will…",
      starters: [
        "After I pour my coffee, I will…",
        "After I brush my teeth, I will…",
        "After I close my laptop, I will…",
      ],
      authoredResponse:
        "Now run two quick checks on your recipe. First, is the anchor something that reliably happens every day, at a clear moment? Second, could you do the tiny behaviour on your worst day? If you hesitated on the second one, shrink it again. It should feel almost too easy. That's what a well-designed habit feels like at the start.",
    },
    feedbackGuidance:
      "Check that the anchor is a reliable existing routine and the behaviour is truly tiny. Encourage shrinking if needed. Be warm and specific to what the user wrote.",
    realWorldExperiment: {
      text: "Try your tiny habit recipe tomorrow, just once. Right after you do it, give yourself a small celebration: a smile, a quiet “yes,” whatever feels natural.",
    },
    keyInsight: {
      headline: "Make it small enough to keep.",
      text: "Lasting habits start with something easy to repeat, and grow from there.",
    },
    sources: [
      {
        title: "Tiny Habits: The Small Changes That Change Everything",
        author: "BJ Fogg",
        kind: "Book",
        year: 2019,
        note: "Source of the anchor, tiny behaviour, and celebration recipe practised in this lesson.",
      },
      {
        title: "How are habits formed: Modelling habit formation in the real world",
        author: "Phillippa Lally, Cornelia H. M. van Jaarsveld, Henry W. W. Potts & Jane Wardle",
        kind: "Research",
        year: 2010,
        note: "Published in the European Journal of Social Psychology. Source of the 66-day median and the 18 to 254 day range.",
      },
      {
        title: "Atomic Habits",
        author: "James Clear",
        kind: "Book",
        year: 2018,
        note: "Background on scaling habits down and linking new behaviours to existing ones.",
      },
    ],
    motivations: ["grow", "understand-myself"],
    keywords: ["habit", "routine", "consisten", "motivat", "start", "daily", "exercise", "meditat", "health", "disciplin", "action"],
    stage: "act",
    journeyReason: "Tiny habits are how insights become part of your actual days.",
  },
  {
    id: "environment-for-focus",
    topicId: "habits",
    title: "Designing Your Environment for Focus",
    subtitle: "Make attention the easy option",
    objective:
      "Spot the cues in your surroundings that pull your attention, and choose a few small changes that make focus easier.",
    centralConcept:
      "Attention is shaped by surroundings. Each visible cue and each second of friction nudges what we do next. Adding friction to distractions and removing it from the work you care about makes focus more likely without extra effort.",
    estimatedMinutes: 5,
    hook: {
      question: "How many times did you pick up your phone today without deciding to?",
      story: [
        "Not the times you meant to. The other ones.",
        "The hand that moves while you're mid-sentence. The tab you open before you've noticed you were bored.",
        "It can feel like a concentration problem. More often it's a surroundings problem, which is much easier to fix.",
      ],
      cta: "Look around you",
    },
    contentBlocks: [
      {
        type: "insight",
        text: "Your attention tends to go wherever your environment makes it easiest to go.",
      },
      {
        type: "paragraph",
        text: "We like to think focus is something we summon from within. In practice, much of it is decided by what's in reach and in view. A visible phone, a pinging tab, a cluttered desk: each one is a small invitation to do something else.",
      },
      {
        type: "paragraph",
        text: "Economist Richard Thaler and legal scholar Cass Sunstein call the layout of options “choice architecture.” Whatever is placed first, closest, or by default gets chosen more. Your desk, your home screen, and your browser all have an architecture, whether or not you designed it.",
      },
      {
        type: "list",
        title: "Two levers",
        items: [
          "Add friction to distractions: phone in another room, logged out of feeds, notifications off.",
          "Remove friction from focus: the document already open, the book on the pillow, the materials laid out the night before.",
        ],
      },
      {
        type: "paragraph",
        text: "Even a few seconds of extra effort can be enough to break an automatic reach. Habit researcher Wendy Wood describes friction as one of the most powerful and underrated forces in behaviour.",
      },
      {
        type: "paragraph",
        text: "Computer scientist Cal Newport adds a ritual dimension: decide in advance where you'll do focused work, for how long, and what stays out of the room. That way you aren't negotiating with yourself in the moment, because the decision has already been made.",
      },
    ],
    alternateExplanation:
      "Think about a supermarket. The sweets by the till aren't there by chance: someone designed the space so reaching for them takes no effort. Your desk and phone work the same way, but nobody designed them on your behalf. Whatever sits at eye level gets picked. Designing for focus means stocking your own shelves, putting what you want to choose within arm's reach and the rest in the back aisle.",
    exercise: {
      type: "selection",
      prompt:
        "Here are some small changes people make to their surroundings. Pick up to three you'd realistically be willing to try this week.",
      items: [
        "Phone in another room while working",
        "Turn off non-human notifications",
        "Move social apps off the home screen",
        "One tab per task",
        "Clear desk before starting",
        "Open tomorrow's first task before logging off",
        "Headphones on as a “focus” signal",
        "A set place used only for deep work",
        "Leave a book where the phone usually sits",
        "Block distracting sites during focus hours",
      ],
      pick: 3,
      followUp:
        "Which one would make the biggest difference for you, and what's the first place or moment you'd try it?",
      placeholder: "The one that would help most is… I'd try it when…",
      authoredResponse:
        "You've just done something most people skip: choosing the change before the moment of temptation, while you're calm. Try starting with only one of your picks. A single change that sticks will do more than three that fade. If it makes focus even slightly easier, that's your environment doing work that willpower used to do.",
    },
    feedbackGuidance:
      "Reflect the user's chosen changes and their context. Encourage starting with one. Keep the tone practical and non-judgmental about distraction.",
    realWorldExperiment: {
      text: "Before your next stretch of focused work, make one change to your surroundings, then notice whether your attention wanders less, more, or the same.",
      prompt: "“For the next 30 minutes, ___ stays out of reach.”",
    },
    keyInsight: {
      headline: "Design the room, not just the resolve.",
      text: "Focus gets easier when the things you want to do are close, and the things that distract you are a few steps away.",
    },
    sources: [
      {
        title: "Nudge: Improving Decisions About Health, Wealth, and Happiness",
        author: "Richard H. Thaler & Cass R. Sunstein",
        kind: "Book",
        note: "Source of the concept of choice architecture: how the arrangement of options shapes behaviour.",
      },
      {
        title: "Good Habits, Bad Habits: The Science of Making Positive Changes That Stick",
        author: "Wendy Wood",
        kind: "Book",
        year: 2019,
        note: "Informs the emphasis on friction as a driver of everyday behaviour.",
      },
      {
        title: "Deep Work: Rules for Focused Success in a Distracted World",
        author: "Cal Newport",
        kind: "Book",
        year: 2016,
        note: "Source of the idea of rituals for focused work: deciding the where, how long, and rules in advance.",
      },
    ],
    motivations: ["grow", "curious"],
    keywords: ["focus", "distract", "attention", "productiv", "phone", "environment", "work", "concentrat", "habit", "procrastinat", "study"],
    stage: "act",
    journeyReason: "A few small changes to your surroundings can protect the attention everything else depends on.",
  },
];
