import type { Lesson } from "@/lib/types";

export const creativityLessons: Lesson[] = [
  {
    id: "think-differently",
    topicId: "creativity",
    title: "Think Differently",
    subtitle: "The power of reframing",
    objective:
      "Practice questioning the way a problem is stated before trying to solve it.",
    centralConcept:
      "How a problem is framed determines which solutions you can see. Reframing means stepping back to ask whether there's a better problem to solve, which often reveals easier and more creative answers.",
    estimatedMinutes: 5,
    hook: {
      question: "What if the problem you're solving isn't the real problem?",
      story: [
        "You own an old office building. The tenants are complaining: the elevator is too slow. Some are threatening to leave.",
        "You call in engineers. A faster motor or a new elevator will cost a fortune and take months.",
        "There's a much cheaper fix that has nothing to do with the elevator at all.",
        "Can you guess it?",
      ],
      cta: "Take a guess",
    },
    contentBlocks: [
      {
        type: "insight",
        text: "The way you describe a problem quietly decides which solutions you're allowed to see.",
      },
      {
        type: "paragraph",
        text: "In the classic version of the slow-elevator story, the building manager puts up mirrors next to the elevator. People get absorbed in looking at themselves, and the complaints drop away. The elevator is exactly as slow as before.",
      },
      {
        type: "paragraph",
        text: "The mirror doesn't solve the stated problem. It solves a different one. “The elevator is slow” became “the wait is annoying,” and that small shift opened up a whole new set of answers.",
      },
      {
        type: "paragraph",
        text: "Innovation writer Thomas Wedell-Wedellsborg, who popularised this example, argues that we're trained to be good at solving problems and rarely taught to question them. We accept the first framing and start digging.",
      },
      {
        type: "list",
        title: "Questions that loosen a frame",
        items: [
          "What are we actually trying to achieve here?",
          "Is there another way to see what's going wrong?",
          "When has this problem not happened? What was different?",
          "How would someone outside this situation describe it?",
        ],
      },
      {
        type: "example",
        title: "In everyday life",
        text: "“I don't have time to exercise” has few solutions. “I haven't found a kind of movement I'd look forward to” has many. The facts are the same, but the second version gives you somewhere to go.",
      },
    ],
    alternateExplanation:
      "Think of a problem statement like a flashlight in a dark room. Wherever you point it, that's the only area you'll search. If your keys aren't in that patch of light, searching harder won't help. Reframing is simply swinging the beam to another part of the room before you start crawling around on the floor.",
    exercise: {
      type: "thought-experiment",
      setup:
        "You're the building manager. Tenants say the elevator is too slow. You have a small budget and want the complaints to stop.",
      question: "Which approach appeals to you most?",
      options: [
        {
          id: "a",
          text: "Get quotes for a faster motor or a second elevator.",
          feedback:
            "This takes the problem exactly as stated: slow elevator, so make it faster. It would work, and sometimes the direct fix is the right one. But it's the most expensive option, and it only exists inside the frame “the problem is speed.”",
        },
        {
          id: "b",
          text: "Put mirrors, music, or a noticeboard by the elevator.",
          feedback:
            "This is the classic reframe: the problem isn't the speed, it's that waiting feels long. Giving people something to do changes the experience for a fraction of the cost. It's worth noticing that it doesn't make the elevator faster at all, and that turned out not to matter.",
        },
        {
          id: "c",
          text: "Find out when complaints peak, and stagger lunch breaks across floors.",
          feedback:
            "A different reframe again: maybe the problem is that everyone needs the elevator at once. This treats it as a question of demand rather than speed or patience. It shows there's rarely just one alternative frame. There are usually several, each revealing different options.",
        },
      ],
      closing:
        "Three framings, three completely different solutions: speed, the experience of waiting, and peak demand. The skill is pausing long enough to ask which problem you want to solve.",
    },
    feedbackGuidance:
      "Celebrate noticing the frame. Make clear the direct solution is not wrong, just one of several. Encourage generating more than one framing.",
    realWorldExperiment: {
      text: "Take one thing that's been annoying you this week. Write the problem down in one sentence. Then rewrite it two more times, each from a different angle, before you try to fix anything.",
      prompt: "“Another way to describe this problem is ___.”",
    },
    keyInsight: {
      headline: "Before you solve it, question it.",
      text: "A better answer often starts with a better description of the problem.",
    },
    sources: [
      {
        title: "What's Your Problem? To Solve Your Toughest Problems, Change the Problems You Solve",
        author: "Thomas Wedell-Wedellsborg",
        kind: "Book",
        year: 2020,
        note: "Source of the reframing approach and the slow-elevator illustration as retold here.",
      },
      {
        title: "Creative Confidence: Unleashing the Creative Potential Within Us All",
        author: "Tom Kelley & David Kelley",
        kind: "Book",
        year: 2013,
        note: "Informs the design-thinking habit of restating a challenge before generating solutions.",
      },
      {
        title: "Thinking, Fast and Slow",
        author: "Daniel Kahneman",
        kind: "Book",
        year: 2011,
        note: "Background on framing effects: how the description of a situation shapes the choices we see.",
      },
    ],
    motivations: ["curious", "grow", "decisions"],
    keywords: ["creativ", "refram", "problem", "think", "stuck", "perspective", "idea", "innovat", "solve"],
    stage: "understand",
    journeyReason: "Reframing is the fastest way to get unstuck from almost any problem.",
  },
  {
    id: "connecting-the-dots",
    topicId: "creativity",
    title: "Connecting the Dots",
    subtitle: "Where unexpected ideas come from",
    objective:
      "See new ideas as combinations of existing ones, and notice the unusual mix of interests you already carry.",
    centralConcept:
      "New ideas are rarely created from nothing. They usually come from connecting existing ideas from different places. The more varied your inputs, the more unusual connections become possible.",
    estimatedMinutes: 5,
    hook: {
      question: "Where were you the last time a good idea arrived?",
      story: [
        "Probably not at your desk, staring at the problem.",
        "More likely in the shower, on a walk, or halfway through a conversation about something else entirely.",
        "Ideas have a strange habit of turning up when we stop looking for them, and of arriving from an unexpected direction.",
        "That isn't an accident. It's a clue about how they're made.",
      ],
      cta: "Follow the clue",
    },
    contentBlocks: [
      {
        type: "insight",
        text: "An idea is usually two old things meeting for the first time.",
      },
      {
        type: "paragraph",
        text: "We like to imagine creativity as a bolt from the blue. People who study it describe something more ordinary: new ideas are mostly combinations. Advertising writer James Webb Young put it plainly in the 1940s: an idea is a new combination of old elements.",
      },
      {
        type: "example",
        title: "A famous combination",
        text: "Around 1440, Johannes Gutenberg borrowed the mechanism of the screw press, used for making wine and oil, and combined it with movable metal type. Neither part was new. The connection was.",
      },
      {
        type: "paragraph",
        text: "Science writer Steven Johnson calls this exploring the “adjacent possible”: each new idea is built from the parts that happen to be within reach. So what's within your reach matters a great deal.",
      },
      {
        type: "paragraph",
        text: "That's the case for wide interests. In his 2005 Stanford commencement address, Steve Jobs described sitting in on a calligraphy class with no practical purpose in mind. Years later, it shaped the typography of the first Macintosh. He said you can only connect the dots looking backwards.",
      },
      {
        type: "paragraph",
        text: "This is good news. You don't need to wait for genius. You can collect more dots by reading outside your field, talking to people unlike you, and following odd curiosities, and then leave quiet gaps for them to find each other.",
      },
    ],
    alternateExplanation:
      "Think of your mind as a kitchen. A cook with only flour, butter, and salt can make a few things well. Add ginger, miso, and lime, and suddenly there are dishes nobody has tasted before. The cook's talent didn't change. The pantry did. Reading widely and following odd interests is how you stock the pantry.",
    exercise: {
      type: "reflection",
      prompt:
        "Name two interests or experiences of yours that seem to have nothing to do with each other. What's one idea, question, or project that could live where they overlap?",
      helper:
        "It doesn't need to be practical. Cooking and spreadsheets. Football and teaching. Gardening and management.",
      placeholder: "Two unrelated things I know about are… Where they meet, I could imagine…",
      starters: ["My job and my hobby", "Something I studied and something I love", "Two places I've lived"],
      authoredResponse:
        "Whatever you paired, almost nobody else has that exact combination, and that's where original ideas tend to come from. The overlap you imagined might be a real project or just a playful thought. Either way, you've practised the central move of creativity: bringing two distant things close enough to touch.",
    },
    feedbackGuidance:
      "Respond with enthusiasm to the specific combination. Build on the user's idea with one further question or possibility. Never judge feasibility.",
    realWorldExperiment: {
      text: "This week, deliberately collect one dot from outside your usual world: an article from an unfamiliar field, a documentary you'd normally skip, or a question for someone whose job you don't understand.",
    },
    keyInsight: {
      headline: "Collect more dots.",
      text: "Creativity is less about inventing from nothing and more about noticing what could belong together.",
    },
    sources: [
      {
        title: "Where Good Ideas Come From: The Natural History of Innovation",
        author: "Steven Johnson",
        kind: "Book",
        year: 2010,
        note: "Source of the “adjacent possible” framing and the Gutenberg press example.",
      },
      {
        title: "A Technique for Producing Ideas",
        author: "James Webb Young",
        kind: "Book",
        note: "The classic short work arguing that ideas are new combinations of existing elements.",
      },
      {
        title: "Stanford University Commencement Address (2005)",
        author: "Steve Jobs",
        kind: "Talk",
        year: 2005,
        note: "Source of the calligraphy story and the idea of connecting dots in hindsight. Paraphrased, not quoted.",
      },
      {
        title: "Range: Why Generalists Triumph in a Specialized World",
        author: "David Epstein",
        kind: "Book",
        year: 2019,
        note: "Background on how breadth of experience supports creative problem-solving.",
      },
    ],
    motivations: ["curious", "grow"],
    keywords: ["creativ", "idea", "innovat", "curious", "learn", "inspir", "art", "write", "think"],
    stage: "understand",
    journeyReason: "Your mix of interests is already the raw material for original ideas.",
  },
  {
    id: "small-experiments",
    topicId: "creativity",
    title: "Small Experiments",
    subtitle: "Turning curiosity into action",
    objective:
      "Shrink a big, vague ambition into a small experiment you could start this week.",
    centralConcept:
      "Instead of committing to a big goal based on a guess, run a small, time-limited experiment and learn from what happens. Experiments lower the cost of being wrong and replace “will I succeed?” with “what will I find out?”",
    estimatedMinutes: 6,
    hook: {
      question: "What's something you've wanted to try for more than a year?",
      story: [
        "Learning to draw. Starting a newsletter. Changing careers. Running.",
        "Chances are it's still on the list because it feels big. To do it properly you'd need time, a plan, and some confidence you don't have yet.",
        "So it waits for the right moment, which is always a few months away.",
        "There's a smaller door into all of these.",
      ],
      cta: "Find the smaller door",
    },
    contentBlocks: [
      {
        type: "insight",
        text: "You don't have to commit to a new life. You can run a small test of one.",
      },
      {
        type: "paragraph",
        text: "Big goals come with a hidden assumption: that you already know what you want and whether you'd enjoy it. Often you don't. You're guessing, and the size of the commitment makes the guess scary.",
      },
      {
        type: "paragraph",
        text: "An experiment flips this around. Neuroscientist and writer Anne-Laure Le Cunff suggests making a small pact with yourself in the form: “I will do this action, for this duration.” The aim is to collect information, with no pressure to succeed.",
      },
      {
        type: "contrast",
        left: {
          label: "Big goal",
          text: "“I'm going to become a writer.” Heavy, vague, and easy to fail.",
        },
        right: {
          label: "Small experiment",
          text: "“I'll write 100 words every morning for 10 days, then see how it felt.” Light, specific, and impossible to fail.",
        },
      },
      {
        type: "paragraph",
        text: "Stanford designers Bill Burnett and Dave Evans call these prototypes. Before changing careers, have coffee with three people who do the job. Before moving to the coast, spend a working week there. You try the life on in miniature.",
      },
      {
        type: "paragraph",
        text: "A good experiment has an end date and a question. When it's over you look at what you learned and choose: continue, adjust, or stop. Stopping counts as a result too.",
      },
    ],
    alternateExplanation:
      "Think about test-driving a car. Nobody buys one by reading the brochure and imagining very hard. You drive it around the block for twenty minutes and your body tells you things no brochure could. A small experiment is a test drive for a possible version of your life. It costs little, takes no commitment, and tells you a lot.",
    exercise: {
      type: "practice",
      situation:
        "A friend tells you: “I've always wanted to learn to cook properly. I keep meaning to sign up for a serious course, but it's expensive and I never have the time.”",
      original: "“I should really become a good cook someday.”",
      task: "Turn the ambition into a small experiment. Use the shape: one specific action, for a short set duration. You can write it for your friend, or swap in something you've been putting off yourself.",
      tips: [
        "One small, specific action",
        "A clear end date (days or weeks, not months)",
        "A question you want answered",
      ],
      placeholder: "I will… for… to find out…",
      sample:
        "“I'll cook one new recipe every Sunday for four weeks, to find out whether I enjoy the process or just like the idea of it.”",
      authoredResponse:
        "Check your experiment against three questions. Could you start within a few days? Does it have an end date? Will you have learned something even if it goes “badly”? If yes to all three, it's a real experiment. If it still feels heavy, halve it. Smaller is nearly always better.",
    },
    feedbackGuidance:
      "Check for a specific action, a short duration, and a learning question. Encourage shrinking further if it seems large. Treat stopping as a valid result.",
    realWorldExperiment: {
      text: "Choose one thing you've been “meaning to try.” Write a one-line pact for the next seven days, small enough that you can't talk yourself out of it.",
      prompt: "“I will ___ for ___ days, to find out ___.”",
    },
    keyInsight: {
      headline: "Don't decide. Experiment.",
      text: "A small test tells you more about what you want than any amount of thinking about it.",
    },
    sources: [
      {
        title: "Tiny Experiments: How to Live Freely in a Goal-Obsessed World",
        author: "Anne-Laure Le Cunff",
        kind: "Book",
        year: 2025,
        note: "Source of the idea of a personal “pact”: a specific action repeated for a set duration, treated as an experiment.",
      },
      {
        title: "Designing Your Life: How to Build a Well-Lived, Joyful Life",
        author: "Bill Burnett & Dave Evans",
        kind: "Book",
        year: 2016,
        note: "Informs the practice of prototyping possible futures through conversations and small trials.",
      },
      {
        title: "Little Bets: How Breakthrough Ideas Emerge from Small Discoveries",
        author: "Peter Sims",
        kind: "Book",
        year: 2011,
        note: "Background on how small, low-risk tests lead to creative breakthroughs.",
      },
    ],
    motivations: ["grow", "curious", "decisions"],
    keywords: ["experiment", "start", "try", "action", "creativ", "procrastinat", "change", "project", "goal", "stuck", "confiden", "career"],
    stage: "act",
    journeyReason: "Small experiments turn what you've learned into something you actually do.",
  },
];
