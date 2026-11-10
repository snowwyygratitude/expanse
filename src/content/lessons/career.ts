import type { Lesson } from "@/lib/types";

export const careerLessons: Lesson[] = [
  {
    id: "influence-without-authority",
    topicId: "career",
    title: "Influence Without Authority",
    subtitle: "Understanding other people's motivations",
    objective:
      "Practice seeing a request from the other person's side, and find what would make helping you worthwhile for them.",
    centralConcept:
      "When you can't tell people what to do, influence comes from understanding what they care about and finding an exchange that serves both sides. People help when a request connects to something that matters to them.",
    estimatedMinutes: 6,
    hook: {
      question: "Why does the same request get a yes from one person and silence from another?",
      story: [
        "You need something from a colleague on another team. It would take them an hour. It would save you a week.",
        "You send a clear, polite message explaining why it's important. To you.",
        "Three days later: nothing.",
        "It's tempting to conclude they're unhelpful. There's a more useful explanation.",
      ],
      cta: "See their side",
    },
    contentBlocks: [
      {
        type: "insight",
        text: "People rarely resist your request. They're busy protecting their own priorities.",
      },
      {
        type: "paragraph",
        text: "Most of working life happens without authority. You can't order a peer, another team, or your own manager to do anything. What you can do is understand them.",
      },
      {
        type: "paragraph",
        text: "Professors Allan Cohen and David Bradford describe influence as a kind of exchange. Everyone at work is trying to get things they value, and those things act like currencies. You gain influence by offering a currency the other person actually wants.",
      },
      {
        type: "list",
        title: "Currencies people care about",
        items: [
          "Progress on their own goals and deadlines",
          "Recognition and visibility for their work",
          "Being consulted, and having their expertise respected",
          "Less hassle: fewer surprises, clearer asks",
          "Learning, or working on something interesting",
        ],
      },
      {
        type: "contrast",
        left: {
          label: "From my side",
          text: "“I need this data by Friday for my launch.”",
        },
        right: {
          label: "From theirs",
          text: "“I know quarter-end is brutal for you. If I send the exact query, could you run it? I'll credit your team in the launch review.”",
        },
      },
      {
        type: "paragraph",
        text: "This isn't manipulation. It only works when the exchange is real and the interest in the other person is sincere. Think of it as doing the work of making yes easy.",
      },
    ],
    alternateExplanation:
      "Imagine trying to get a lift from a stranger. “I need to get to the airport” is about you. “Are you heading toward the airport? I'll cover the petrol” starts from where they're already going and what they'd gain. Same destination, completely different request. Influence at work is mostly finding out which direction someone is already driving.",
    exercise: {
      type: "perspectives",
      setup:
        "You need Priya, an analyst on another team, to pull some numbers for your project this week. She hasn't replied to your message. Tap each card to see the situation from the inside.",
      viewpoints: [
        {
          id: "you",
          who: "Your view",
          thought:
            "“It's a small ask and my project is a company priority. Why is this so hard? I've already explained how important it is.”",
        },
        {
          id: "priya",
          who: "Priya's view",
          thought:
            "“I have four ‘urgent’ requests from four teams and my own deadline on Thursday. This one doesn't say exactly what's needed, so it'll turn into a back-and-forth. It can wait.”",
        },
        {
          id: "manager",
          who: "Priya's manager",
          thought:
            "“My team gets treated like a help desk. I want them recognised for the analysis they do, and I want requests to come in properly scoped.”",
        },
      ],
      question: "Knowing all this, what would you try next?",
      options: [
        {
          id: "a",
          text: "Follow up and stress that leadership considers the project a priority.",
          feedback:
            "It might work, and sometimes urgency really does need saying. But it's still entirely your currency. To Priya it's a fifth “urgent” in the pile, and leaning on leadership can cost you goodwill you'll want later.",
        },
        {
          id: "b",
          text: "Send a tightly scoped ask, offer to work around her Thursday deadline, and credit her team in your write-up.",
          feedback:
            "This pays in currencies Priya and her manager care about: less hassle, respect for her deadline, and recognition. It takes more effort from you up front, which is rather the point. You're doing the work of making yes easy.",
        },
        {
          id: "c",
          text: "Ask your manager to escalate it to her manager.",
          feedback:
            "Escalation is a legitimate tool when something is stuck and time matters. Used first, though, it tends to confirm the “help desk” feeling on the other side, and it skips the chance to build a working relationship with Priya directly.",
        },
      ],
      closing:
        "The request never changed. What changed was how much of the other person's world was visible in it.",
    },
    feedbackGuidance:
      "Encourage perspective-taking and sincere exchange. Note legitimate uses of urgency and escalation. Avoid framing influence as manipulation or tricks.",
    realWorldExperiment: {
      text: "Before your next request to someone who doesn't report to you, spend one minute answering this, then reshape the ask around it:",
      prompt: "“What is this person trying to get done this week, and how could my request help or at least not hurt?”",
    },
    keyInsight: {
      headline: "Start from what they care about.",
      text: "Influence isn't pushing harder. It's understanding someone well enough that helping you makes sense to them.",
    },
    sources: [
      {
        title: "Influence Without Authority",
        author: "Allan R. Cohen & David L. Bradford",
        kind: "Book",
        note: "Source of the exchange model of influence and the idea of organizational “currencies.”",
      },
      {
        title: "Getting to Yes: Negotiating Agreement Without Giving In",
        author: "Roger Fisher, William Ury & Bruce Patton",
        kind: "Book",
        note: "Informs the focus on underlying interests rather than stated positions.",
      },
      {
        title: "Influence: The Psychology of Persuasion",
        author: "Robert B. Cialdini",
        kind: "Book",
        note: "Background on reciprocity: people tend to return help they have received.",
      },
    ],
    motivations: ["grow", "relationships"],
    keywords: ["influence", "career", "work", "persua", "colleague", "team", "leader", "manager", "job", "negotiat", "professional"],
    stage: "relate",
    journeyReason: "Most of what you want at work depends on people who don't have to say yes.",
  },
  {
    id: "giving-better-feedback",
    topicId: "career",
    title: "Giving Better Feedback",
    subtitle: "Helping others grow",
    objective:
      "Turn a vague judgment into feedback someone can actually use, by describing what you saw and its effect.",
    centralConcept:
      "Feedback lands when it describes a specific situation, an observable behaviour, and its impact, rather than a verdict on the person. Specific and caring beats vague and nice, and vague and harsh.",
    estimatedMinutes: 6,
    hook: {
      question: "What's the most useful piece of feedback anyone ever gave you?",
      story: [
        "If one comes to mind, it probably wasn't “great job” or “needs improvement.”",
        "It was likely oddly specific. Someone noticed exactly what you did, and told you what it caused.",
        "Most feedback is nothing like that. It's a verdict, delivered kindly or unkindly, that leaves you guessing what to change.",
      ],
      cta: "See the difference",
    },
    contentBlocks: [
      {
        type: "insight",
        text: "Useful feedback describes what happened. Useless feedback describes what you are.",
      },
      {
        type: "paragraph",
        text: "“You're disorganised” is a verdict about a person. There's nothing to do with it except agree or argue. “The agenda arrived ten minutes before the meeting, so nobody had read it” is an observation. It can be acted on tomorrow.",
      },
      {
        type: "paragraph",
        text: "The Center for Creative Leadership teaches a simple structure for this, known as SBI.",
      },
      {
        type: "list",
        title: "Situation, Behaviour, Impact",
        items: [
          "Situation: when and where. “In Tuesday's client call…”",
          "Behaviour: what you observed, like a camera would. “…you answered their pricing question before they'd finished asking…”",
          "Impact: what it led to. “…and I noticed they went quiet for the rest of the call.”",
        ],
      },
      {
        type: "paragraph",
        text: "Structure alone isn't enough. Kim Scott, who coined the term Radical Candor, argues that good feedback needs two things at once: you care about the person, and you're willing to be direct. Caring without directness becomes empty niceness. Directness without care is just harsh.",
      },
      {
        type: "paragraph",
        text: "The same recipe works for praise. “Great presentation” fades in an hour. “The customer story you opened with made the whole room lean in” tells someone exactly what to do again.",
      },
    ],
    alternateExplanation:
      "Think of a sports coach reviewing match footage with a player. They don't say “you're a sloppy defender.” They pause the video: “Here, at minute 34, you stepped forward and left this gap, and that's where the goal came from.” The player can see it and fix it. Good feedback is like pausing the footage, rather than reviewing the player.",
    exercise: {
      type: "practice",
      situation:
        "Your teammate Sam just presented to the wider team. The content was solid, but Sam rushed through 30 slides in 15 minutes and people looked lost. Afterwards, Sam asks you: “How did it go?”",
      original: "“Honestly? It was kind of confusing.”",
      task: "Rewrite the feedback using Situation, Behaviour, Impact. Aim for something Sam could act on before the next presentation.",
      tips: [
        "Name the specific moment",
        "Describe what you saw, not what Sam “is”",
        "Share the effect it had",
      ],
      placeholder: "Write what you'd say to Sam…",
      sample:
        "“The analysis itself was really strong. In the middle section, you went through about ten slides in two minutes, and I noticed people stopped taking notes and started looking at each other. I think they lost the thread there. If you picked the three slides that matter most, I think it would really land.”",
      authoredResponse:
        "Read your version back and check it against the camera test: could someone who wasn't in the room picture what happened? If your feedback names a moment, describes what you saw, and says what it caused, Sam has something to work with. Bonus if it also shows you're on Sam's side.",
    },
    feedbackGuidance:
      "Check for a specific situation, an observable behaviour (not a trait), and a stated impact. Affirm warmth and directness. Offer one gentle suggestion at most.",
    realWorldExperiment: {
      text: "Give one piece of specific positive feedback today. Skip “nice work” and tell someone exactly what they did and what it made possible.",
      prompt: "“When you ___, it meant that ___.”",
    },
    keyInsight: {
      headline: "Describe the moment, not the person.",
      text: "Feedback helps people grow when it's specific enough to act on and kind enough to hear.",
    },
    sources: [
      {
        title: "Situation-Behavior-Impact (SBI) feedback model",
        author: "Center for Creative Leadership",
        kind: "Framework",
        note: "The three-part structure practised in this lesson.",
      },
      {
        title: "Radical Candor",
        author: "Kim Scott",
        kind: "Book",
        year: 2017,
        note: "Source of the idea that effective feedback combines caring personally with challenging directly.",
      },
      {
        title: "Thanks for the Feedback: The Science and Art of Receiving Feedback Well",
        author: "Douglas Stone & Sheila Heen",
        kind: "Book",
        note: "Informs our attention to how feedback is experienced by the person receiving it.",
      },
    ],
    motivations: ["grow", "relationships"],
    keywords: ["feedback", "manage", "leader", "team", "career", "work", "mentor", "colleague", "communicat", "professional"],
    stage: "relate",
    journeyReason: "Specific, caring feedback is one of the most generous skills you can build.",
  },
  {
    id: "decisions-under-uncertainty",
    topicId: "career",
    title: "Decisions Under Uncertainty",
    subtitle: "How to move forward without perfect information",
    objective:
      "Sort decisions by how reversible they are, so you know when to move quickly and when to slow down.",
    centralConcept:
      "Most decisions are reversible “two-way doors” that deserve speed, not agonising. A few are hard to undo and deserve care. Separately, a good decision is one made well with what you knew, not one that happened to turn out well.",
    estimatedMinutes: 6,
    hook: {
      question: "How much information is enough to decide?",
      story: [
        "You've been turning a decision over for weeks. You've made the list. You've asked three friends, who gave three answers.",
        "You tell yourself you'll decide once you know a bit more.",
        "But the missing information isn't coming. The future doesn't send previews.",
        "So how do people who decide well actually do it?",
      ],
      cta: "Find out",
    },
    contentBlocks: [
      {
        type: "insight",
        text: "The first question isn't “what should I choose?” It's “how hard would this be to undo?”",
      },
      {
        type: "paragraph",
        text: "In a letter to Amazon shareholders, Jeff Bezos described two kinds of decisions. Some are one-way doors: once you walk through, it's very hard to come back. Most are two-way doors: if you don't like what you find, you can step back out.",
      },
      {
        type: "contrast",
        left: {
          label: "Two-way door",
          text: "Trying a new tool, taking a course, testing a side project. Decide quickly, learn, adjust.",
        },
        right: {
          label: "One-way door",
          text: "Selling a home, ending a partnership, a public commitment. Slow down, gather views, sleep on it.",
        },
      },
      {
        type: "paragraph",
        text: "The common mistake is treating two-way doors like one-way doors, and pouring weeks of worry into choices that could simply be tried. Waiting feels safe, but it has a cost too: the time, and everything you'd have learned by starting.",
      },
      {
        type: "paragraph",
        text: "A second idea comes from former poker player Annie Duke. She warns against “resulting,” which means judging a decision by how it turned out. A careful choice can end badly through bad luck. A reckless one can get lucky. If you only judge by results, you learn the wrong lessons.",
      },
      {
        type: "paragraph",
        text: "Put together: check the door, decide with the best information you can reasonably get, and judge yourself on the quality of the thinking rather than the roll of the dice.",
      },
    ],
    alternateExplanation:
      "Think about the difference between trying on a jacket and getting a tattoo. With the jacket, deliberating for an hour in the shop is silly: just try it on, and take it back if it's wrong. With the tattoo, an hour of thought is the bare minimum. Most daily decisions are jackets that we treat like tattoos.",
    exercise: {
      type: "scenario",
      setup:
        "Your manager offers you the chance to lead a six-month project in an area you know little about. You'd keep your current role afterwards either way. They'd like an answer by Friday. You feel a mix of excitement and “what if I'm bad at this?”",
      question: "What's your next move?",
      options: [
        {
          id: "a",
          text: "Ask for a few more weeks so you can research the area properly first.",
          feedback:
            "Wanting to be prepared is a good instinct. But notice what kind of door this is: six months, with your role waiting for you afterwards. Extra weeks of research may tell you less than the first two weeks of actually doing it, and the delay has its own cost.",
        },
        {
          id: "b",
          text: "Spend an hour with someone who's led a similar project, then decide by Friday.",
          feedback:
            "This matches the effort to the door. One conversation is a cheap, fast way to fill the biggest gap in what you know, and you still decide on time. You won't have certainty, and that's fine for a choice you can recover from.",
        },
        {
          id: "c",
          text: "Decline. It's safer to stay with what you're good at.",
          feedback:
            "Declining is a real option, and sometimes the right one if your plate is full or the project doesn't interest you. It's worth checking the reason, though. If the main driver is fear of being bad at it, remember the door swings both ways, and staying put isn't free of risk either.",
        },
      ],
      closing:
        "Whichever way you'd go, the useful move is the same: ask how reversible the choice is before deciding how much to worry about it.",
    },
    feedbackGuidance:
      "Tie feedback to reversibility and to matching effort with stakes. Respect that declining can be valid. Avoid telling the user what career choice to make.",
    realWorldExperiment: {
      text: "Pick one decision you've been putting off. Ask whether it's a one-way or two-way door. If it's two-way, set a 24-hour deadline and decide.",
      prompt: "“If this goes badly, how would I undo it?”",
    },
    keyInsight: {
      headline: "Check the door before you agonise.",
      text: "If you can walk back through it, decide and learn. Save your slow, careful thinking for the choices you can't undo.",
    },
    sources: [
      {
        title: "Letter to Amazon Shareholders (2015)",
        author: "Jeff Bezos",
        kind: "Essay",
        note: "Source of the distinction between hard-to-reverse and easily reversible decisions, often described as one-way and two-way doors.",
      },
      {
        title: "Thinking in Bets: Making Smarter Decisions When You Don't Have All the Facts",
        author: "Annie Duke",
        kind: "Book",
        year: 2018,
        note: "Source of the term “resulting” and the separation of decision quality from outcome quality.",
      },
      {
        title: "Decisive: How to Make Better Choices in Life and Work",
        author: "Chip Heath & Dan Heath",
        kind: "Book",
        year: 2013,
        note: "Background on widening options and testing assumptions with small trials before committing.",
      },
    ],
    motivations: ["decisions", "grow"],
    keywords: ["decision", "decide", "uncertain", "career", "choice", "stuck", "overthink", "job", "confiden", "procrastinat", "perfection"],
    stage: "decide",
    journeyReason: "Knowing when to decide fast frees your energy for the choices that deserve it.",
  },
];
