export const adaCopy = {
  zh: {
    meta: {
      title: "Ada — 你的个人 Agent",
      description: "认识 Ada，xopc 中的个人 Agent。聊聊近况、语音通话、交办后台任务并随时纠偏与验收，把工作与生活中的繁琐事交出去。",
    },
    eyebrow: "xopc 的个人 Agent",
    headline: ["认识 Ada。", "慢慢说，我在听。"],
    description:
      "Ada 是住在 xopc 里的个人 Agent。你可以和它文字聊天或实时语音通话，把还没想清的念头理顺，顺手把工作与生活中的事交办出去，留出时间做自己在意的事。",
    download: "下载 xopc，认识 Ada",
    watch: "观看 Ada 介绍",
    film: "Ada · 把周末，还给自己。",
    included: "与工作空间、资料库在同一个 xopc 应用里，无需另外安装。",
    demo: "真实客户端演示 · 按自己的节奏，出去透口气",
    introduction: "不用准备好一切。\n先聊聊你。",
    introductionBody: "你的背景、习惯，或一件还没想清楚的事。Ada 从这里开始，也在一次次真实协作中逐渐记住你的节奏。",
    stages: [
      {
        image: "discussion",
        title: "按你的方式，\n一起想清楚。",
        body: "说说目标，补充细节。想少打字时也可以直接和 Ada 语音通话或录一段语音笔记，下一步在对话中慢慢清晰。",
        chapter: 2,
        watch: "看看如何讨论",
        alt: "真实 xopc 对话：不想做攻略，只想带相机出去透口气",
      },
      {
        image: "delegate",
        title: "有件事，\n交给 Ada。",
        body: "把想出门的念头或手头的工作交办出去。Ada 在后台通过 Task Router 分配专家去执行，你无需干等，还可以继续聊别的。",
        chapter: 3,
        watch: "看看如何交办",
        alt: "真实 xopc 成果：个人 Agent 生成可查看的周末出行计划",
      },
      {
        image: "revision",
        title: "中途可纠偏，\n结果可验收与修订。",
        body: "执行中想改方向可以随时插话纠偏（Steer）；结果回来后按验收标准检查，想调整哪里直接在原任务里提修改，原版照样保留。",
        chapter: 4,
        watch: "看看结果与修改",
        alt: "真实 xopc 产出：把90分钟出行改成30分钟的轻松路线",
      },
    ],
    contextAlt: "真实 xopc 对话：告诉 Ada 今天只想轻松出门",
    capabilitiesTitle: "不只是陪聊，\nAda 正在变得更能干。",
    capabilitiesDesc: "随着 xopc 持续演进，Ada 已经把对话、语音、任务闭环和主动跟进连成一体。",
    capabilities: [
      {
        tag: "后台委派 · TASK ROUTER",
        title: "交办不卡对话，中途随时纠偏",
        body: "把整理文件、写方案、做表格或调研交给 Ada，后台自动匹配合适专家执行；过程中可插话改方向，结果带清晰验收状态返回。",
      },
      {
        tag: "实时语音与笔记",
        title: "打个语音电话，或随手录段语音笔记",
        body: "支持与 Ada 实时语音通话，并自动衔接历史上下文；外出时在手机录一段语音，回来已经整理成项目笔记和待办。",
      },
      {
        tag: "克制的主动性",
        title: "重复请求变草稿，安静时段不打扰",
        body: "首页会把你反复提过的事整理成任务草稿等你确认；持续关注的话题支持设置安静时段，只在真正有进展或需要决定时提醒。",
      },
      {
        tag: "多端与对话式配置",
        title: "手机、微信随时聊，说话就能配环境",
        body: "在 iOS、Android、鸿蒙 App 或微信、飞书、Slack 里都能继续找 Ada；连模型、通道和 MCP 也可以直接用自然语言让它引导配好。",
      },
    ],
    relationship: "Ada，住在 xopc 里。",
    relationshipBody:
      "你可以先和 Ada 聊聊，也可以带上文件直接进入工作空间与资料库。两种开始方式共享同一份本地记忆与任务体系，都能处理工作与生活中的事情。",
    workspace: "了解 xopc 如何工作",
    learn: "探索与学习",
    faqTitle: "开始之前。",
    faqs: [
      {
        question: "Ada、xopc 和 Loopi 是什么关系？",
        answer:
          "xopc 是运行在你电脑上的开源、本地优先 AI 助理系统；Ada 是住在 xopc 里的个人 Agent（默认名称，可自定义名字、头像与回复风格）；Loopi 是 xopc 的品牌伙伴与桌面宠物。它们都在同一个应用里，无需另外安装。",
      },
      {
        question: "怎么开始使用 Ada？",
        answer:
          "下载 xopc 桌面应用，通过引导或直接说话连接模型服务，再打开左侧的 Ada。先告诉它你的背景和偏好，然后试着交办一件小事；也可以随时开启新对话或归档旧会话。",
      },
      {
        question: "交办任务后，我怎么确保结果靠谱？",
        answer:
          "任务进入后台后，你可以在结果卡查看进展和产物；执行中随时插话纠偏。符合条件的委派支持自动验收，重要任务则可以在交办时指定人工验收，满意再归档到资料库。",
      },
      {
        question: "我的资料在哪里？",
        answer:
          "xopc 的核心状态默认保存在本机 ~/.xopc/。使用云模型时，对应提供商会处理当前请求上下文；需要数据留在本地时可切换 Ollama 等本地模型。你可以随时查看、纠正和删除记忆。",
      },
    ],
    privacy: "查看隐私与数据边界",
    closing: "下一件事，\n和 Ada 一起开始。",
    closingBody: "下载 xopc，认识你的个人 Agent。",
  },
  en: {
    meta: {
      title: "Ada — Your personal Agent",
      description:
        "Meet Ada, your personal Agent inside xopc. Chat or talk by voice, delegate background tasks, steer mid-run, and review deliverables across work and life.",
    },
    eyebrow: "Your personal Agent in xopc",
    headline: ["Meet Ada.", "Take your time. I’m listening."],
    description:
      "Ada is the personal Agent living inside xopc. Chat or talk over voice, untangle ideas, delegate work and everyday tasks to background specialists, and make time for what matters to you.",
    download: "Download xopc. Meet Ada.",
    watch: "Watch the Ada film",
    film: "Ada · A little more weekend for you",
    included: "Ada, your workspace, and your Library live in the same xopc app. No separate install.",
    demo: "Real desktop demo · Chinese interface · Optional English captions",
    introduction: "You do not need a perfect brief.\nStart with you.",
    introductionBody: "Your background, your habits, or an idea you are still figuring out. Ada starts there and learns through real work together.",
    stages: [
      {
        image: "discussion",
        title: "Think it through.\nYour way.",
        body: "Share the goal, talk over voice, or capture a quick voice note. Find the next step together without filling out a rigid form.",
        chapter: 2,
        watch: "See the conversation",
        alt: "Real xopc conversation: asking for some fresh air with a camera, without a packed itinerary",
      },
      {
        image: "delegate",
        title: "Give Ada\nsomething to do.",
        body: "Hand off a weekend plan or a work deliverable. Ada routes it to a specialist Agent in the background while you keep talking.",
        chapter: 3,
        watch: "See a task being delegated",
        alt: "Real xopc output: a one-page weekend outing plan made by the personal Agent",
      },
      {
        image: "revision",
        title: "Steer mid-run.\nReview and revise.",
        body: "Adjust direction mid-flight whenever priorities shift. Inspect delivered files against acceptance checks, and ask for atomic revisions while keeping earlier versions.",
        chapter: 4,
        watch: "See the result and revision",
        alt: "Real xopc output: a 90-minute outing revised into a relaxed 30-minute route",
      },
    ],
    contextAlt: "Real xopc conversation: telling Ada you want an easy outing today",
    capabilitiesTitle: "More than chat.\nBuilt to carry real work.",
    capabilitiesDesc: "Ada brings together conversation, voice, background task delivery, and calm proactivity inside one local app.",
    capabilities: [
      {
        tag: "DELEGATION · TASK ROUTER",
        title: "Keep chatting while work runs—and steer anytime",
        body: "Delegate files, research, or spreadsheets while Ada assigns the right specialist in the background. Steer mid-run and review results against clear acceptance criteria.",
      },
      {
        tag: "VOICE CALLS & VOICE NOTES",
        title: "Talk in real time or record on the go",
        body: "Start a real-time voice call with Ada carrying your conversation context, or record a quick voice note on mobile and turn it into project notes and tasks.",
      },
      {
        tag: "EARNED PROACTIVITY",
        title: "Repeated requests become drafts, with quiet hours",
        body: "Home surfaces repeated requests as concrete task drafts for your review. Followed topics respect quiet hours so updates arrive only when useful.",
      },
      {
        tag: "MOBILE & CONVERSATIONAL SETUP",
        title: "Continue from mobile or chat apps—configure by talking",
        body: "Stay connected on iOS, Android, HarmonyOS, Weixin, Feishu, or Slack, and set up models, channels, or MCP through plain conversation.",
      },
    ],
    relationship: "Ada lives in xopc.",
    relationshipBody:
      "Talk with Ada or bring files straight to the workspace and Library. Both ways to begin share the same local memory and task system across work and everyday life.",
    workspace: "See how xopc works",
    learn: "Explore & learn",
    faqTitle: "Before you begin.",
    faqs: [
      {
        question: "How do Ada, xopc, and Loopi fit together?",
        answer:
          "xopc is the open-source, local-first AI assistant system running on your computer. Ada is the personal Agent inside xopc (customizable in name, avatar, and tone). Loopi is the xopc brand companion and desktop pet. All live in one app.",
      },
      {
        question: "How do I get started?",
        answer:
          "Download the xopc desktop app, connect a model provider via guided setup or plain conversation, and open Ada in the sidebar. Share your preferences, then hand off one small task.",
      },
      {
        question: "How do I stay in control of delegated work?",
        answer:
          "Track deliverables in the task result card and steer mid-run if needed. Eligible tasks can verify automatically, or you can request manual sign-off before archiving to your Library.",
      },
      {
        question: "Where does my data go?",
        answer:
          "Core state lives locally in ~/.xopc/. Cloud providers process the request context you send to them; choose local models like Ollama when data must stay on-device. Memory is always inspectable, correctable, and deletable.",
      },
    ],
    privacy: "Explore privacy and data boundaries",
    closing: "Your next idea.\nA little help from Ada.",
    closingBody: "Download xopc. Meet your personal Agent.",
  },
} as const;
