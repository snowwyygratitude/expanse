import type { Lesson } from "@/lib/types";

export const communicationLessons: Lesson[] = [
  {
    id: "art-of-listening",
    topicId: "communication",
    title: "The Art of Listening",
    subtitle: "Why people don't always want solutions",
    objective:
      "Notice the difference between helping someone solve a problem and helping them feel understood.",
    centralConcept:
      "People often share difficulties to feel understood, not to receive solutions. Acknowledging the experience first makes any later advice far more welcome.",
    estimatedMinutes: 5,
    hook: {
      question: "Why do people sometimes reject our perfectly good advice?",
      story: [
        "Imagine a friend has had a terrible day at work. They call you and start venting about their manager.",
        "You care about them, so you jump in with three things they could do.",
        "But instead of thanking you, they sound even more frustrated. Maybe a little flat. “Yeah. I guess.”",
        "What just happened?",
      ],
      cta: "Find out",
    },
    contentBlocks: [
      {
        type: "insight",
        text: "People don't always need solutions. Sometimes they need understanding.",
      },
      {
        type: "paragraph",
        text: "When someone shares something hard, they are often looking for empathy, connection, or simply room to say it out loud. The problem is real, but it isn't always the point.",
      },
      {
        type: "paragraph",
        text: "Jumping straight to fixes can quietly send a different message than the one we intend: your feelings are a problem to get past. The advice might be excellent. It just arrives before the person feels heard, so it lands as pressure.",
      },
      {
        type: "contrast",
        left: {
          label: "Fixing first",
          text: "“Have you tried talking to HR?” The conversation becomes about the solution, and whether they've been doing enough.",
        },
        right: {
          label: "Understanding first",
          text: "“That sounds draining. What happened?” The conversation stays about them, and they keep talking.",
        },
      },
      {
        type: "example",
        title: "A small tell",
        text: "Listen for “yes, but…”. When someone answers each suggestion with a reason it won't work, they usually aren't being difficult. They're telling you they aren't ready for solutions yet.",
      },
      {
        type: "paragraph",
        text: "None of this means advice is bad. It means order matters. Understanding first tends to make people more open to ideas afterwards, and sometimes they find their own answer while talking.",
      },
    ],
    alternateExplanation:
      "Think of a doctor who writes a prescription before you've finished describing your symptoms. The prescription might even be right, but you'd leave doubting it, because you never felt examined. Advice works the same way: people trust the solution more once they're sure you've seen the whole problem, including how it feels.",
    exercise: {
      type: "scenario",
      setup: "Your friend sighs and says:",
      quote:
        "I'm so tired of my boss criticizing everything I do. I don't think I can keep doing this.",
      question: "How would you respond?",
      options: [
        {
          id: "a",
          text: "“You should probably start looking for another job.”",
          feedback:
            "Practical advice might help eventually, and leaving may even be the right call. But this moves into problem-solving before you know what your friend needs. They may hear “your situation is simple” when it doesn't feel simple at all.",
        },
        {
          id: "b",
          text: "“That sounds really exhausting. What's been the hardest part?”",
          feedback:
            "This acknowledges what your friend is feeling and invites them to say more. It creates space for understanding before solutions. The trade-off: it takes longer, and it asks you to sit with their frustration without fixing it.",
        },
        {
          id: "c",
          text: "“Everyone has difficult bosses sometimes.”",
          feedback:
            "Your intention might be to normalize the experience and reassure them they're not alone. But your friend may feel their frustration is being minimized, as if it's too ordinary to deserve attention.",
        },
      ],
      closing:
        "There's no single right script here. The useful question is what each response makes room for, and what it closes off.",
    },
    feedbackGuidance:
      "Highlight the trade-off between acknowledging feelings and offering solutions. Advice is not wrong, but timing matters. Avoid declaring a single correct answer.",
    realWorldExperiment: {
      text: "During your next conversation with someone who seems frustrated, try asking:",
      prompt:
        "“Do you want me to help think through solutions, or would it help more if I just listened?”",
    },
    keyInsight: {
      headline: "Understand first. Solve second.",
      text: "Sometimes the most helpful thing you can offer isn't a solution. It's the feeling of being understood.",
    },
    sources: [
      {
        title: "Active Listening",
        author: "Carl R. Rogers & Richard E. Farson",
        kind: "Essay",
        year: 1957,
        note: "The original case for listening to understand the speaker's point of view, rather than to evaluate or fix.",
      },
      {
        title: "Nonviolent Communication: A Language of Life",
        author: "Marshall B. Rosenberg",
        kind: "Book",
        note: "Informs the idea that empathy means staying with someone's feelings and needs before offering advice.",
      },
      {
        title: "You're Not Listening: What You're Missing and Why It Matters",
        author: "Kate Murphy",
        kind: "Book",
        year: 2020,
        note: "A journalist's exploration of why being listened to is rare, and how curiosity changes conversations.",
      },
    ],
    motivations: ["relationships", "grow", "curious"],
    keywords: ["listen", "communicat", "relationship", "friend", "partner", "empathy", "connect", "conversation"],
    stage: "relate",
    journeyReason: "Feeling heard is the foundation of almost every good relationship.",
  },
  {
    id: "difficult-conversations",
    topicId: "communication",
    title: "Difficult Conversations",
    subtitle: "How to disagree without escalating",
    objective:
      "See a disagreement from outside both sides, and open a hard conversation in a way the other person can join.",
    centralConcept:
      "Most arguments are two people defending different stories about the same events. Starting from a neutral “third story” lowers defensiveness and makes real conversation possible.",
    estimatedMinutes: 6,
    hook: {
      question: "Why do some conversations go wrong in the first ten seconds?",
      story: [
        "You've been rehearsing it in your head all day. You finally say it: “We need to talk about how you never help around here.”",
        "Before you've finished the sentence, the other person is already building their defence.",
        "You came to solve a problem. Somehow you're now in a debate about the word “never.”",
      ],
      cta: "See why",
    },
    contentBlocks: [
      {
        type: "insight",
        text: "In most disagreements, each person is the reasonable one in their own story.",
      },
      {
        type: "paragraph",
        text: "We tend to open hard conversations from inside our own version of events: what you did, and what it did to me. From where we stand, that version just feels like the facts.",
      },
      {
        type: "paragraph",
        text: "The trouble is that the other person has a version too, and in theirs they also make sense. When we lead with ours, they hear an accusation and start defending theirs. The conversation becomes a contest over whose story wins.",
      },
      {
        type: "paragraph",
        text: "Negotiation researchers suggest a different opening: the third story. Describe the situation the way a neutral observer would, as a difference between you rather than a fault in them.",
      },
      {
        type: "contrast",
        left: {
          label: "My story",
          text: "“You never help around the house and I'm sick of it.”",
        },
        right: {
          label: "Third story",
          text: "“I think we see the housework differently, and it's been bothering me. Can we talk about how each of us sees it?”",
        },
      },
      {
        type: "paragraph",
        text: "The third story doesn't ask you to give up your view. It just starts from a description both people can agree with, which buys you the chance to actually be heard.",
      },
    ],
    alternateExplanation:
      "Picture two people looking at the same mountain from opposite valleys. Each can describe their side in perfect detail, and each description is accurate. Arguing about whose view is correct gets nowhere. The third story is like climbing to the ridge together first: “We're seeing two different sides of this. Show me yours, then I'll show you mine.”",
    exercise: {
      type: "perspectives",
      setup:
        "Maya and Jon share a flat. Jon has left dishes in the sink three nights in a row. Tonight Maya snapped, and it turned into a fight. Tap each card to hear the story from the inside.",
      viewpoints: [
        {
          id: "maya",
          who: "Maya's story",
          thought:
            "“I've asked nicely before. Coming home to a mess after a long day makes me feel like my time doesn't count. If he cared, he'd notice.”",
        },
        {
          id: "jon",
          who: "Jon's story",
          thought:
            "“I'm on deadline all week and always clean up at the weekend, like I said I would. She didn't ask, she attacked. Apparently nothing I do counts.”",
        },
        {
          id: "third",
          who: "The third story",
          thought:
            "Two flatmates have different rhythms for cleaning, and different ideas of what was agreed. Both feel unappreciated. Neither has said that part out loud.",
        },
      ],
      question: "If Maya could restart the conversation, which opening would you try?",
      options: [
        {
          id: "a",
          text: "“I need you to finally take the dishes seriously.”",
          feedback:
            "It's clear and honest about what Maya wants. But “finally” carries the whole history with it, and Jon is likely to respond to the accusation rather than the request.",
        },
        {
          id: "b",
          text: "“I think we have different ideas about when dishes get done. Can we figure out something that works for both of us?”",
          feedback:
            "This is a third-story opening: it names the difference without assigning blame. Jon can agree with the description, which makes it easier for him to hear what comes next. The risk is sounding too neutral, so Maya will still need to say how it affects her.",
        },
        {
          id: "c",
          text: "Say nothing and just wash them herself.",
          feedback:
            "This keeps the peace tonight, and sometimes that's a reasonable choice. Over time, though, unspoken frustration tends to leak out sideways, and Jon never learns that something is wrong.",
        },
      ],
      closing:
        "Notice that the third story didn't require anyone to be wrong. It only required someone to step outside their own version for a moment.",
    },
    feedbackGuidance:
      "Emphasize that both sides have coherent stories. A neutral framing reduces defensiveness, but the speaker's feelings still deserve to be voiced. Avoid picking a winner.",
    realWorldExperiment: {
      text: "Think of one small, ongoing friction in your life. Before raising it, write a single sentence describing it the way a neutral friend of both of you would.",
      prompt: "“It seems like we see ___ differently. Can we talk about it?”",
    },
    keyInsight: {
      headline: "Start from the story you both can agree on.",
      text: "You don't have to give up your side to begin somewhere neutral. You just have to be heard before you can be understood.",
    },
    sources: [
      {
        title: "Difficult Conversations: How to Discuss What Matters Most",
        author: "Douglas Stone, Bruce Patton & Sheila Heen",
        kind: "Book",
        note: "Source of the “third story” idea and the observation that each side has its own coherent account.",
      },
      {
        title: "The Seven Principles for Making Marriage Work",
        author: "John M. Gottman & Nan Silver",
        kind: "Book",
        note: "Informs the point that how a conversation begins strongly shapes how it goes; Gottman calls a blaming opener a “harsh startup.”",
      },
      {
        title: "Crucial Conversations: Tools for Talking When Stakes Are High",
        author: "Kerry Patterson, Joseph Grenny, Ron McMillan & Al Switzler",
        kind: "Book",
        note: "Background on keeping dialogue safe enough that both people keep sharing what they really think.",
      },
    ],
    motivations: ["relationships", "grow"],
    keywords: ["conflict", "disagree", "argu", "difficult", "communicat", "partner", "relationship", "fight", "confiden"],
    stage: "relate",
    journeyReason: "Hard conversations get easier when you know how to open them.",
  },
  {
    id: "boundaries",
    topicId: "communication",
    title: "Boundaries",
    subtitle: "How to say no without damaging relationships",
    objective:
      "Practice declining a request in a way that is clear, kind, and honest about what you're protecting.",
    centralConcept:
      "A boundary is a statement about what you will do, not a judgment of the other person. A clear, warm no usually protects a relationship better than a resentful yes.",
    estimatedMinutes: 6,
    hook: {
      question: "Have you ever said yes while your whole body was saying no?",
      story: [
        "A colleague asks if you can cover for them on Saturday. You have plans. You've been looking forward to them all week.",
        "“Sure, no problem,” you hear yourself say.",
        "On Saturday you're there, doing the favour, and quietly resenting every minute. They have no idea.",
      ],
      cta: "Explore this",
    },
    contentBlocks: [
      {
        type: "insight",
        text: "A resentful yes often costs a relationship more than an honest no.",
      },
      {
        type: "paragraph",
        text: "We usually say yes to protect the relationship. We imagine that no will disappoint people, look selfish, or start a conflict. So we agree, and pay for it later in tiredness and quiet resentment.",
      },
      {
        type: "paragraph",
        text: "But think about it from the other side. Most people would rather hear a clear no than receive a yes that comes with hidden irritation. A boundary tells others where you actually stand, which makes you easier to trust.",
      },
      {
        type: "paragraph",
        text: "Negotiator William Ury describes a useful shape for this: a no sandwiched between two yeses. First, the thing you're saying yes to (your own priority). Then the no. Then a yes to the relationship.",
      },
      {
        type: "list",
        title: "The shape of a kind no",
        items: [
          "Yes to what you're protecting: “I've promised myself this Saturday to rest.”",
          "A clear no: “So I can't cover the shift.”",
          "Yes to the relationship: “I hope you find someone. Ask me again another time.”",
        ],
      },
      {
        type: "paragraph",
        text: "Notice what's missing: a long apology, an invented excuse, or a “maybe” you don't mean. Short and warm tends to work better than long and guilty.",
      },
    ],
    alternateExplanation:
      "Think of a boundary like the fence around a garden. The fence isn't there because you dislike your neighbours. It's there so the garden can exist at all, and so neighbours know where the path is. A fence with a gate is friendlier than no fence and a gardener who's secretly furious every time someone walks across the beds.",
    exercise: {
      type: "practice",
      situation:
        "A friend messages you: “Hey! Could you help me move this Sunday? It'll probably take most of the day 🙏” You've had an exhausting month and Sunday is the only free day you have.",
      original: "“Um, I think I might be busy… I'll see if I can move things around? Sorry!!”",
      task: "Rewrite the reply so it's clear, kind, and true. You can offer an alternative if you'd genuinely like to, but you don't have to.",
      tips: [
        "Say what you're protecting, briefly",
        "Make the no unmistakable",
        "End with warmth toward the person",
      ],
      placeholder: "Write your reply…",
      sample:
        "“I'd love to help, but I really need Sunday to recharge after this month, so I can't do the move. I could bring dinner over on Monday once you're in, though. Good luck with it!”",
      authoredResponse:
        "Read your reply back as if you were the friend receiving it. Is it clear whether you're coming? Does it sound like you still care about them? If both are true, you've done the hard part. If you added an offer, check that it's one you'd actually be glad to keep.",
    },
    feedbackGuidance:
      "Look for clarity (is the no unambiguous?), honesty (no invented excuses), and warmth. Affirm what works. Offering an alternative is optional, never required. Do not lecture.",
    realWorldExperiment: {
      text: "The next time someone asks for your time and you feel that small inner “ugh”, buy yourself a pause before answering:",
      prompt: "“Let me check and get back to you.”",
    },
    keyInsight: {
      headline: "A clear no is a form of kindness.",
      text: "Boundaries don't push people away. They tell people where to find you.",
    },
    sources: [
      {
        title: "The Power of a Positive No",
        author: "William Ury",
        kind: "Book",
        note: "Source of the “yes, no, yes” structure for declining while protecting the relationship.",
      },
      {
        title: "Set Boundaries, Find Peace: A Guide to Reclaiming Yourself",
        author: "Nedra Glover Tawwab",
        kind: "Book",
        year: 2021,
        note: "A therapist's practical view of boundaries as clear statements of what you need, rather than punishments.",
      },
      {
        title: "Essentialism: The Disciplined Pursuit of Less",
        author: "Greg McKeown",
        kind: "Book",
        note: "Informs the idea that every yes is also a no to something else you care about.",
      },
    ],
    motivations: ["relationships", "grow", "understand-myself"],
    keywords: ["boundar", "say no", "people pleas", "confiden", "assert", "relationship", "communicat", "burnout", "guilt"],
    stage: "relate",
    journeyReason: "Knowing how to say no makes your yes mean more.",
  },
];
