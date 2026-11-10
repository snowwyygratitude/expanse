import type { Lesson } from "@/lib/types";

export const moneyLessons: Lesson[] = [
  {
    id: "money-and-happiness",
    topicId: "money",
    title: "Money and Happiness",
    subtitle: "What are you really optimizing for?",
    objective:
      "Look past the price tag to what your spending actually buys you: time, experience, connection, security, or status.",
    centralConcept:
      "Money does relate to well-being, but how you use it matters as much as how much you have. Spending that buys time, experiences, and connection tends to satisfy more than spending on things we quickly get used to.",
    estimatedMinutes: 5,
    hook: {
      question: "What's the best $50 you ever spent?",
      story: [
        "Take a second. Something probably came to mind.",
        "Here's a guess: it wasn't the most impressive thing you own. It might have been a dinner, a train ticket, a gift, or paying someone to do a job you hate.",
        "There's a pattern in which purchases we remember fondly, and it says something about what money is actually for.",
      ],
      cta: "See the pattern",
    },
    contentBlocks: [
      {
        type: "insight",
        text: "Money is a tool. The interesting question is what you're using it to build.",
      },
      {
        type: "paragraph",
        text: "Does money buy happiness? The research answer is: partly, and it depends. Large studies find that well-being does tend to rise with income. Researchers still debate whether that levels off at higher incomes, and for whom.",
      },
      {
        type: "paragraph",
        text: "What's clearer is that people at the same income can feel very differently about their lives, and part of that difference is how they spend. We adapt fast to most things we own. The new phone is thrilling for a week and normal by the next month.",
      },
      {
        type: "list",
        title: "Spending that tends to last",
        items: [
          "Buying time: paying to remove a chore or shorten a commute.",
          "Experiences: especially ones shared with others, which we relive in memory.",
          "Other people: gifts and generosity often feel better than expected.",
          "Peace of mind: a cushion that lets you say no to things.",
        ],
      },
      {
        type: "paragraph",
        text: "Writer Morgan Housel puts a version of this simply: the highest dividend money pays is control over your time. That's a perspective, not a rule. Your own answer might be security, freedom, generosity, or something else.",
      },
      {
        type: "paragraph",
        text: "The point isn't to feel guilty about buying nice things. It's to notice what a purchase is really buying, so more of your money goes toward what you care about.",
      },
    ],
    alternateExplanation:
      "Think of money like electricity. Nobody wants electricity for its own sake. You want light, warmth, music, a cold fridge. Having more of it helps only as far as it's wired to something you value. Two homes with the same power bill can feel completely different, depending on what's plugged in.",
    exercise: {
      type: "reflection",
      prompt:
        "Think of a purchase from the last year, large or small, that you're still glad about. What did it really buy you?",
      helper:
        "Look underneath the object itself: time, a memory, closeness with someone, calm, a sense of who you are.",
      placeholder: "I'm still glad I spent money on… because what it really gave me was…",
      starters: ["It gave me time", "It was a shared memory", "It made daily life calmer"],
      authoredResponse:
        "Notice what you named underneath the purchase. When people do this exercise, the thing itself is rarely the answer. It's usually time, ease, connection, or a memory. That's a clue about what you're really optimizing for. It can be interesting to hold your next few purchases up against it and see which ones match.",
    },
    feedbackGuidance:
      "Reflect what the user says the purchase gave them (time, connection, experience, security, identity). Stay curious. Never give personalized financial directives or judge their spending.",
    realWorldExperiment: {
      text: "Before your next non-essential purchase this week, pause and finish this sentence. Then buy it or don't, with no judgment either way.",
      prompt: "“What I'm really buying here is ___.”",
    },
    keyInsight: {
      headline: "Ask what the money is really buying.",
      text: "More isn't the only lever. Pointing what you have toward what you value changes how it feels.",
    },
    sources: [
      {
        title: "Happy Money: The Science of Happier Spending",
        author: "Elizabeth Dunn & Michael Norton",
        kind: "Book",
        year: 2013,
        note: "Source of the themes around buying time, buying experiences, and spending on others.",
      },
      {
        title: "High income improves evaluation of life but not emotional well-being",
        author: "Daniel Kahneman & Angus Deaton",
        kind: "Research",
        year: 2010,
        note: "Published in PNAS. An influential study suggesting day-to-day emotional well-being levels off at higher incomes.",
      },
      {
        title: "Experienced well-being rises with income, even above $75,000 per year",
        author: "Matthew A. Killingsworth",
        kind: "Research",
        year: 2021,
        note: "Published in PNAS. A later study finding no plateau on average, which is why we describe this question as still debated.",
      },
      {
        title: "The Psychology of Money",
        author: "Morgan Housel",
        kind: "Book",
        year: 2020,
        note: "Informs the idea that control over your time is one of the most valuable things money can provide.",
      },
    ],
    motivations: ["decisions", "understand-myself", "curious"],
    keywords: ["money", "spend", "financ", "happy", "happiness", "wealth", "salary", "save", "budget"],
    stage: "understand",
    journeyReason: "Knowing what you want money for makes every money decision simpler.",
  },
  {
    id: "power-of-compounding",
    topicId: "money",
    title: "The Power of Compounding",
    subtitle: "Why time changes outcomes",
    objective:
      "Build an intuition for exponential growth, and see why starting early matters more than starting big.",
    centralConcept:
      "Compounding is growth that builds on previous growth. Because it accelerates over time, the length of time involved usually matters more than the size of each contribution. Our intuition, which thinks in straight lines, consistently underestimates it.",
    estimatedMinutes: 6,
    hook: {
      question: "Would you rather have $1 million today, or a penny that doubles every day for 30 days?",
      story: [
        "Most people's gut says: take the million, obviously.",
        "On day 10, the penny is worth $5.12. On day 20, about $5,000. It still looks like a terrible deal.",
        "On day 30 it's worth more than $5 million.",
        "Nearly all of that arrived in the last few days. That shape, slow then sudden, is hiding in more of life than you'd think.",
      ],
      cta: "See how it works",
    },
    contentBlocks: [
      {
        type: "insight",
        text: "Compounding looks like nothing is happening, for a long time. Then it looks like everything is.",
      },
      {
        type: "paragraph",
        text: "Compounding simply means growth that earns its own growth. Interest gets added to your savings, and next year you earn interest on the interest too. Each step is small. The steps stack.",
      },
      {
        type: "paragraph",
        text: "Our minds are built to think in straight lines: twice the time, twice the result. Compounding curves upward instead, so we reliably underestimate it. Psychologists call this exponential growth bias.",
      },
      {
        type: "example",
        title: "A quick rule of thumb",
        text: "The Rule of 72: divide 72 by a yearly growth rate to estimate how long doubling takes. At 6% a year, money doubles roughly every 12 years. So over 36 years it doubles three times and becomes about eight times larger.",
      },
      {
        type: "paragraph",
        text: "This is why time is the main ingredient. In The Psychology of Money, Morgan Housel points out that most of Warren Buffett's wealth arrived after his 50th birthday. He's a skilled investor, but his real edge is that he started as a child and never stopped.",
      },
      {
        type: "paragraph",
        text: "Compounding cuts both ways: debts with high interest grow by the same maths. And it reaches beyond money. Skills, relationships, and reputations all build on themselves, slowly and then noticeably.",
      },
    ],
    alternateExplanation:
      "Picture a snowball rolling down a long hill. At the top it picks up a few flakes per turn and barely changes. But a bigger ball has more surface, so each turn collects more than the last. Near the bottom it's adding more snow in one roll than in its first hundred. The length of the hill matters far more than how big the snowball was at the start.",
    exercise: {
      type: "simulator",
      simulator: "compounding",
      intro:
        "Two people each put aside $200 a month until age 65. The only difference is when they begin. Move the sliders and watch what time does.",
      closing:
        "Notice how much of the final amount is growth rather than money put in, and how quickly that share shrinks when the start date slips. This is an illustration with a steady, made-up growth rate. Real returns vary from year to year and are never guaranteed.",
    },
    feedbackGuidance:
      "This is an illustrative model, not advice. Emphasize the role of time and the non-linear shape. Never recommend specific investments or actions with the user's money.",
    realWorldExperiment: {
      text: "Pick one thing in your life that compounds, and it doesn't have to be money: a skill, a friendship, your health. Do one small thing for it today that your future self would thank you for.",
    },
    keyInsight: {
      headline: "Time does the heavy lifting.",
      text: "With anything that compounds, starting small and early usually beats starting big and late.",
    },
    sources: [
      {
        title: "The Psychology of Money",
        author: "Morgan Housel",
        kind: "Book",
        year: 2020,
        note: "Source of the observation about how much of Warren Buffett's wealth is explained by time rather than returns alone.",
      },
      {
        title: "The Little Book of Common Sense Investing",
        author: "John C. Bogle",
        kind: "Book",
        note: "Background on how compounding returns, and compounding costs, shape long-term outcomes.",
      },
      {
        title: "Exponential Growth Bias and Household Finance",
        author: "Victor Stango & Jonathan Zinman",
        kind: "Research",
        year: 2009,
        note: "Published in The Journal of Finance. Documents people's tendency to underestimate compound growth.",
      },
    ],
    motivations: ["decisions", "grow", "curious"],
    keywords: ["money", "invest", "save", "saving", "financ", "compound", "retire", "wealth", "future", "long-term"],
    stage: "understand",
    journeyReason: "Understanding compounding changes how you think about small, early steps.",
  },
  {
    id: "understanding-risk",
    topicId: "money",
    title: "Understanding Risk",
    subtitle: "How to think about uncertain decisions",
    objective:
      "Separate how risky something feels from how risky it is, and learn two questions that make uncertain choices clearer.",
    centralConcept:
      "We feel losses roughly twice as strongly as equivalent gains, which makes us avoid some good bets and misjudge others. Thinking about risk well means asking what the downside would cost you and whether you could absorb it, not just how the bet feels.",
    estimatedMinutes: 6,
    hook: {
      question: "Would you take a bet you're likely to come out ahead on?",
      story: [
        "Someone offers you a coin flip. Heads, you win $150. Tails, you lose $100.",
        "On paper it's a good deal. The win is bigger than the loss and the odds are even.",
        "And yet a lot of people feel a small, firm “no” somewhere in their stomach.",
        "That feeling is one of the most studied in all of psychology.",
      ],
      cta: "Explore the feeling",
    },
    contentBlocks: [
      {
        type: "insight",
        text: "Losing $100 hurts about twice as much as winning $100 feels good.",
      },
      {
        type: "paragraph",
        text: "Daniel Kahneman and Amos Tversky called this loss aversion. In their experiments, people typically needed a potential win of around double the potential loss before a 50/50 bet felt acceptable.",
      },
      {
        type: "paragraph",
        text: "Loss aversion isn't irrational in itself. A loss you can't recover from really is worse than a missed gain. The trouble is that the feeling fires just as loudly for small, survivable risks, and can steer us away from chances that would serve us well.",
      },
      {
        type: "list",
        title: "Two questions that cut through the feeling",
        items: [
          "Can I afford the downside? If the bad outcome would be painful but survivable, the risk is a different kind of thing than one that could sink you.",
          "Is this a one-off, or one of many? A single coin flip is a gamble. A hundred similar, small, favourable bets is closer to a strategy.",
        ],
      },
      {
        type: "example",
        title: "Risk isn't only about money",
        text: "The same pattern shows up when deciding whether to speak up in a meeting, apply for a stretch role, or reach out to someone. The possible embarrassment looms larger than the possible gain, even when it's small and brief.",
      },
      {
        type: "paragraph",
        text: "Thinking clearly about risk isn't about becoming fearless. It's about checking whether the size of the feeling matches the size of the actual stakes.",
      },
    ],
    alternateExplanation:
      "Think of a smoke alarm that goes off both for a real fire and for burnt toast. You'd never remove it, because the one time it matters, it really matters. But you learn to look before you panic. Loss aversion is that alarm. The skill isn't silencing it, it's glancing at the kitchen to see whether it's a fire or toast.",
    exercise: {
      type: "thought-experiment",
      setup:
        "Back to the coin flip. Heads, you win $150. Tails, you lose $100. Nobody is watching and there's no trick.",
      question: "What's your honest first reaction?",
      options: [
        {
          id: "a",
          text: "No thanks. Losing $100 would bother me more than winning $150 would please me.",
          feedback:
            "That's loss aversion, described almost word for word, and it's the most common response. It's also a perfectly reasonable choice if losing $100 would actually sting this month. The question worth asking is whether the feeling would change if the amounts were $1.50 and $1. If it wouldn't, it's the feeling talking rather than the stakes.",
        },
        {
          id: "b",
          text: "Sure, I'd take it. The odds are in my favour.",
          feedback:
            "You weighed the bet on its numbers, which many people find hard. It's worth adding one check: could you shrug off the loss if it came up tails? A favourable bet is still a poor idea when the downside is something you can't absorb. Size matters as much as odds.",
        },
        {
          id: "c",
          text: "Only if I could play it many times.",
          feedback:
            "You've spotted something important: repetition changes the nature of a risk. Over many flips, the favourable odds have room to show up and a single loss matters less. It's interesting to notice how many of life's small risks are actually repeated games, even though each one feels like a one-off.",
        },
      ],
      closing:
        "None of these answers is wrong. Each one reflects a different question about risk: how it feels, what the odds are, and how often you get to play.",
    },
    feedbackGuidance:
      "Explain loss aversion and the difference between affordable and unaffordable downsides without recommending any real financial action. Respect that declining a bet can be entirely reasonable.",
    realWorldExperiment: {
      text: "Think of a small risk you've been avoiding, such as sending a message, asking a question, or trying something new. Write down the realistic worst case, and whether you could live with it.",
      prompt: "“The worst realistic outcome is ___. Could I handle that?”",
    },
    keyInsight: {
      headline: "Check the size of the fear against the size of the stakes.",
      text: "Feeling a risk strongly doesn't make it large. Ask what the downside would really cost, and whether you could absorb it.",
    },
    sources: [
      {
        title: "Prospect Theory: An Analysis of Decision under Risk",
        author: "Daniel Kahneman & Amos Tversky",
        kind: "Research",
        year: 1979,
        note: "Published in Econometrica. The original description of how people weigh losses more heavily than equivalent gains.",
      },
      {
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        kind: "Book",
        year: 2011,
        note: "Discusses favourable coin-flip bets like the one in this lesson, and how viewing risks as part of a series changes the choice.",
      },
      {
        title: "Against the Gods: The Remarkable Story of Risk",
        author: "Peter L. Bernstein",
        kind: "Book",
        note: "Background on how humans learned to reason about probability and consequences.",
      },
    ],
    motivations: ["decisions", "grow", "understand-myself"],
    keywords: ["risk", "decision", "uncertain", "fear", "money", "invest", "choice", "confiden", "afraid", "bold"],
    stage: "decide",
    journeyReason: "Seeing risk clearly helps you tell real danger from mere discomfort.",
  },
];
