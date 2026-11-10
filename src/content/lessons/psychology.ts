import type { Lesson } from "@/lib/types";

export const psychologyLessons: Lesson[] = [
  {
    id: "hidden-shortcuts",
    topicId: "psychology",
    title: "Your Mind's Hidden Shortcuts",
    subtitle: "Recognizing cognitive biases",
    objective:
      "Catch one of your mind's shortcuts in the act, and learn a simple question that slows it down.",
    centralConcept:
      "The mind uses fast mental shortcuts to save effort. They work well most of the time, but they also produce predictable errors, such as judging value relative to a nearby number instead of in absolute terms.",
    estimatedMinutes: 5,
    hook: {
      question: "Is five dollars always worth five dollars?",
      story: [
        "It sounds like a trick question. Of course it is.",
        "And yet most of us will happily cross town to save $5 on one purchase, and not lift a finger to save the very same $5 on another.",
        "Your mind is doing something clever here, and slightly strange. Let's catch it in the act.",
      ],
      cta: "Try it on yourself",
    },
    contentBlocks: [
      {
        type: "insight",
        text: "Your mind rarely judges things on their own. It judges them compared to whatever is nearby.",
      },
      {
        type: "paragraph",
        text: "Psychologists Daniel Kahneman and Amos Tversky spent decades studying how people actually make judgments. Their conclusion: much of our thinking runs on fast, automatic shortcuts, which they called heuristics.",
      },
      {
        type: "paragraph",
        text: "Shortcuts are a feature. Without them you'd be exhausted by lunchtime, deliberating over every small choice. But they come with side effects: predictable patterns of error known as cognitive biases.",
      },
      {
        type: "list",
        title: "Three shortcuts you'll recognise",
        items: [
          "Relative thinking: $5 feels big next to $15 and tiny next to $500.",
          "Anchoring: the first number you hear pulls your estimate toward it, even when it's irrelevant.",
          "Confirmation bias: we notice evidence for what we already believe more easily than evidence against it.",
        ],
      },
      {
        type: "example",
        title: "Where it shows up",
        text: "A “was $200, now $120” tag feels like a win, even if you'd never have paid $120 for it on its own. The crossed-out price is doing the persuading.",
      },
      {
        type: "paragraph",
        text: "Knowing about biases doesn't switch them off. Even Kahneman said he still fell for them. What helps is slowing down at the moments that matter and asking a different question.",
      },
    ],
    alternateExplanation:
      "Think of your mind's shortcuts like autocomplete on your phone. Most of the time it guesses the right word and saves you effort, so you stop checking. Occasionally it confidently inserts something absurd. You wouldn't switch autocomplete off, but for an important message you'd reread before hitting send. Noticing biases is that reread.",
    exercise: {
      type: "thought-experiment",
      setup:
        "You're about to buy headphones for $40. The cashier mentions that the same pair is $30 at their other branch, a 15-minute walk away. Later that day you're buying a $900 laptop, and learn it's $890 at a shop 15 minutes away.",
      question: "What would you honestly do?",
      options: [
        {
          id: "a",
          text: "Walk for the headphones, but not for the laptop.",
          feedback:
            "This is the most common answer, and it's the shortcut in action. The saving is $10 for 15 minutes both times, but 25% off feels meaningful while about 1% off feels like nothing. Your mind compared the saving to the price, not to the value of your time.",
        },
        {
          id: "b",
          text: "Walk both times. Ten dollars is ten dollars.",
          feedback:
            "You treated the two cases consistently, which is what an economist would predict but fewer people actually do. One thing worth checking: is 15 minutes of your time worth $10 to you today? Consistency is only useful if the trade itself is one you'd choose.",
        },
        {
          id: "c",
          text: "Skip both. My time matters more than $10.",
          feedback:
            "Also consistent, in the other direction. You put a price on your time and applied it evenly. It can still be worth noticing whether the headphones discount tugged at you more than the laptop one. Most people feel the pull even when they don't act on it.",
        },
      ],
      closing:
        "The interesting part isn't which answer you chose. It's that the two situations feel different at all, when the trade is identical.",
    },
    feedbackGuidance:
      "Explain relative thinking without shaming the user. All three answers are defensible; the insight is the felt asymmetry between identical trades.",
    realWorldExperiment: {
      text: "The next time a discount or a “deal” tempts you, ignore the percentage and the original price. Ask one plain question instead:",
      prompt: "“Would I trade this much of my time or money for this, if I'd never seen the other number?”",
    },
    keyInsight: {
      headline: "Notice what you're comparing to.",
      text: "Your mind's shortcuts aren't flaws to eliminate. They're habits to notice, especially when the stakes are real.",
    },
    sources: [
      {
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        kind: "Book",
        year: 2011,
        note: "The foundation for this lesson: fast, automatic judgment versus slow, deliberate reasoning, and the biases that follow.",
      },
      {
        title: "The Framing of Decisions and the Psychology of Choice",
        author: "Amos Tversky & Daniel Kahneman",
        kind: "Research",
        year: 1981,
        note: "Published in Science. Includes the classic finding that people will travel to save a fixed amount on a cheap item but not on an expensive one; our scenario adapts that idea with new details.",
      },
      {
        title: "Predictably Irrational",
        author: "Dan Ariely",
        kind: "Book",
        note: "Accessible examples of how comparisons and anchors shape everyday choices.",
      },
    ],
    motivations: ["understand-myself", "decisions", "curious"],
    keywords: ["bias", "psycholog", "decision", "think", "mind", "behavio", "second-guess", "rational", "human"],
    stage: "notice",
    journeyReason: "Seeing your own mental shortcuts is the first step to choosing more freely.",
  },
  {
    id: "naming-emotions",
    topicId: "psychology",
    title: "Understanding Emotions",
    subtitle: "Why naming a feeling can help",
    objective:
      "Practice describing a feeling with more precision than “good,” “bad,” or “stressed.”",
    centralConcept:
      "Putting a specific name on a feeling tends to reduce its intensity and makes it easier to know what to do next. A richer emotional vocabulary gives you more options.",
    estimatedMinutes: 5,
    hook: {
      question: "When did you last feel “stressed”? Are you sure that's what it was?",
      story: [
        "“Stressed” is one of the most useful words we have, and one of the least informative.",
        "It can mean overwhelmed. Or dreading one particular email. Or lonely, or underprepared, or resentful that nobody offered to help.",
        "Each of those calls for something completely different. But only if you know which one you're feeling.",
      ],
      cta: "Look closer",
    },
    contentBlocks: [
      {
        type: "insight",
        text: "A feeling you can name precisely is a feeling you can do something about.",
      },
      {
        type: "paragraph",
        text: "In brain-imaging research led by psychologist Matthew Lieberman, people were shown photos of emotional faces. When they simply put a word to the emotion they saw, activity in the brain's alarm system eased. Researchers call this affect labeling.",
      },
      {
        type: "paragraph",
        text: "Naming seems to shift us from being inside a feeling to looking at it. “I am furious” becomes “I notice I'm feeling furious.” A small gap opens up, and with it, some choice.",
      },
      {
        type: "paragraph",
        text: "Precision matters too. Neuroscientist Lisa Feldman Barrett uses the term emotional granularity for the ability to make fine distinctions between feelings. People who can tell “disappointed” from “embarrassed” from “left out” tend to cope more flexibly, because each word points to a different need.",
      },
      {
        type: "contrast",
        left: {
          label: "Blurry",
          text: "“I feel bad about the meeting.” What would help? Hard to say.",
        },
        right: {
          label: "Precise",
          text: "“I feel overlooked. I had an idea and nobody asked.” Now there's something to act on.",
        },
      },
      {
        type: "paragraph",
        text: "This isn't about analysing every mood. It's a quick pause to find the truer word. Think of it as adjusting the focus on a camera.",
      },
    ],
    alternateExplanation:
      "Imagine telling a mechanic “my car feels wrong.” They can't do much with that. “It pulls to the left when I brake” is something they can fix. Emotions work similarly: “I feel bad” gives you nothing to work with, while “I feel left out” tells you exactly where to look.",
    exercise: {
      type: "selection",
      prompt:
        "Think of a recent moment you'd have summed up as “stressed” or “in a bad mood.” Looking back, which words come closer to what you actually felt? Pick up to three.",
      items: [
        "Overwhelmed",
        "Anxious",
        "Disappointed",
        "Resentful",
        "Lonely",
        "Embarrassed",
        "Unappreciated",
        "Restless",
        "Guilty",
        "Worn out",
        "Insecure",
        "Left out",
      ],
      pick: 3,
      followUp:
        "Now that it has a more precise name, what do you think that feeling was asking for?",
      placeholder: "Maybe rest, reassurance, help, a conversation…",
      authoredResponse:
        "Notice how the question changes once the word changes. “Stressed” mostly asks for the feeling to stop. A more specific word usually points somewhere: toward rest, a conversation, an apology, or a request for help. You don't have to act on it. Simply knowing what the feeling is about is often enough to loosen its grip.",
    },
    feedbackGuidance:
      "Reflect back the chosen emotion words and gently connect them to possible underlying needs. Do not diagnose or interpret beyond what the user wrote. Keep it light and curious.",
    realWorldExperiment: {
      text: "Once today, when you notice a strong feeling, pause for ten seconds and finish this sentence with the most specific word you can find:",
      prompt: "“Right now I'm noticing that I feel ___.”",
    },
    keyInsight: {
      headline: "Name it to loosen it.",
      text: "The more precisely you can name a feeling, the less it runs the show, and the clearer your next step becomes.",
    },
    sources: [
      {
        title: "Putting Feelings Into Words: Affect Labeling Disrupts Amygdala Activity in Response to Affective Stimuli",
        author: "Matthew D. Lieberman and colleagues",
        kind: "Research",
        year: 2007,
        note: "Published in Psychological Science. The brain-imaging study behind the idea that labeling an emotion can dampen the brain's alarm response.",
      },
      {
        title: "How Emotions Are Made: The Secret Life of the Brain",
        author: "Lisa Feldman Barrett",
        kind: "Book",
        year: 2017,
        note: "Source of the concept of emotional granularity and why finer emotion words give us more options.",
      },
      {
        title: "Emotional Agility",
        author: "Susan David",
        kind: "Book",
        year: 2016,
        note: "Informs the framing of emotions as information to notice, rather than commands to obey.",
      },
    ],
    motivations: ["understand-myself", "relationships", "curious"],
    keywords: ["emotion", "feel", "anxi", "stress", "psycholog", "mood", "myself", "calm", "overwhelm"],
    stage: "notice",
    journeyReason: "Naming what you feel gives you more room to choose how to respond.",
  },
  {
    id: "what-matters",
    topicId: "psychology",
    title: "What Really Matters to You",
    subtitle: "Clarifying personal values",
    objective:
      "Identify a few values that feel like yours, and notice where your week does and doesn't reflect them.",
    centralConcept:
      "Values are directions you choose to move in, not goals to complete. Much of the low-level dissatisfaction people feel comes from a gap between what they value and how their time is actually spent.",
    estimatedMinutes: 6,
    hook: {
      question: "If someone followed you around for a week, what would they guess you care about most?",
      story: [
        "They wouldn't hear your intentions. They'd only see where your time and attention went.",
        "For most of us, the honest answer is a little uncomfortable. The things we'd say matter most are often the things that get whatever time is left over.",
        "That gap is worth looking at. Gently.",
      ],
      cta: "Take a look",
    },
    contentBlocks: [
      {
        type: "insight",
        text: "Goals can be finished. Values can only be lived.",
      },
      {
        type: "paragraph",
        text: "A goal is a destination: get the promotion, run the race. A value is a direction: being generous, staying curious, showing up for family. You never arrive at “curious.” You just keep choosing it, or not.",
      },
      {
        type: "paragraph",
        text: "Psychologists who work with Acceptance and Commitment Therapy use a simple image for this: values are a compass, not a map. A compass doesn't tell you the route. It tells you whether you're still facing the way you meant to go.",
      },
      {
        type: "paragraph",
        text: "This matters because it's possible to hit every goal and still feel off, if the goals were pointing somewhere you never chose. And it's possible to have a hard, unglamorous week that feels deeply right.",
      },
      {
        type: "example",
        title: "Borrowed values",
        text: "Some values are inherited rather than chosen: from family, from work culture, from whoever we compare ourselves to. A quick test is to ask, “Would I still care about this if nobody ever knew?”",
      },
      {
        type: "paragraph",
        text: "There are no correct values, and yours will shift across your life. The aim isn't to rank yourself. It's to see clearly, so your choices are yours.",
      },
    ],
    alternateExplanation:
      "Think about sailing. A destination is a harbour you might reach one day. A value is more like the direction you set the sails: west, say. You can sail west for a lifetime without ever “completing” west. Storms will push you off course, and that's normal. What matters is that you know which way you meant to head, so you can turn back toward it.",
    exercise: {
      type: "selection",
      prompt:
        "Without overthinking, pick the three that feel most like you at your best. Not the ones you think you should pick.",
      items: [
        "Curiosity",
        "Connection",
        "Freedom",
        "Security",
        "Creativity",
        "Kindness",
        "Achievement",
        "Adventure",
        "Honesty",
        "Health",
        "Family",
        "Growth",
        "Calm",
        "Contribution",
        "Playfulness",
        "Independence",
      ],
      pick: 3,
      followUp:
        "Which of your three got the least of your time or attention this past week? What might one small step toward it look like?",
      placeholder: "The one I've been neglecting is… A small step could be…",
      authoredResponse:
        "Most people find at least one chosen value that barely showed up in their week. That isn't a failure, it's information. Values rarely need a dramatic life change. They're usually served by something small and specific: twenty minutes, one message, one decision made a little differently. And it's fine if your three change next year.",
    },
    feedbackGuidance:
      "Mirror the user's chosen values without judging them. Encourage a small, concrete step. Do not prescribe what they should value or how to live.",
    realWorldExperiment: {
      text: "Pick one of your three values. Tomorrow, do one ten-minute thing that points toward it, and notice how it feels compared with the rest of your day.",
    },
    keyInsight: {
      headline: "Values are a compass, not a finish line.",
      text: "You don't need to overhaul your life to live by what matters. You need to keep turning, a little, in its direction.",
    },
    sources: [
      {
        title: "The Happiness Trap",
        author: "Russ Harris",
        kind: "Book",
        note: "An accessible introduction to Acceptance and Commitment Therapy, including the distinction between values and goals.",
      },
      {
        title: "A Liberated Mind: How to Pivot Toward What Matters",
        author: "Steven C. Hayes",
        kind: "Book",
        year: 2019,
        note: "By the originator of ACT; informs the idea of values as freely chosen directions.",
      },
      {
        title: "Man's Search for Meaning",
        author: "Viktor E. Frankl",
        kind: "Book",
        note: "Background for the idea that a sense of meaning comes from what we choose to orient our lives around.",
      },
    ],
    motivations: ["understand-myself", "decisions", "grow"],
    keywords: ["value", "purpose", "meaning", "priorit", "myself", "direction", "lost", "intentional", "confiden", "matter"],
    stage: "understand",
    journeyReason: "Knowing what you value gives every other decision a reference point.",
  },
];
