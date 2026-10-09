export const experienceCopy = {
  zh: {
    personal: { headline: "属于你的个人 Agent。", description: "聊聊最近的事，告诉它你的习惯。需要帮忙时，把一件事交给它。", watch: "观看个人 Agent 介绍", film: "Personal AI · 从近况到周计划", caption: "真实桌面对话 · 一周的工作与摄影计划", alt: "在 Personal AI 中介绍背景、表达回复偏好，并继续讨论周计划", points: [
      { title: "按你的方式交流", body: "告诉它你的背景、偏好和当下的目标。" },
      { title: "交办，也能继续聊", body: "执行任务的同时，继续讨论新的想法。" },
      { title: "结果回来，继续打磨", body: "打开文件，看清结果，再交代下一步。" },
    ] },
    work: { headline: "打开工作空间。\n把想法做出来。", description: "带入文件，说明目标。从分析数据到准备汇报，把结果留在你的工作里。", watch: "观看完整工作演示", film: "Work · 从资料到交付", caption: "真实产出 · 来自 xopc 桌面演示", points: [
      { title: "理清一份表格", body: "检查数据、整理月度汇总，再看清趋势。", alt: "xopc 交付的 Excel：月度销售、订单与总计", chapter: 2, asset: "spreadsheet" },
      { title: "准备一次汇报", body: "把数据和结论做成可继续编辑的 PPT。", alt: "xopc 交付的销售汇报：数据结论与月度趋势图", chapter: 3, asset: "slides" },
      { title: "看结果，再修改", body: "调整汇报重点，让成果贴合你的需要。", alt: "按用户要求修改的 PPT：周五之前的三项行动", chapter: 4, asset: "revision" },
    ] },
    choose: "一个 xopc，两种开始方式。", personalHint: "随时聊聊，也能交代事情。", workHint: "带上资料，直接开始工作。", personalTags: "对话 · 偏好 · 委托", workTags: "文件 · 项目 · 交付", explore: "看看它能做什么", try: "下载 xopc", samples: "从真实场景开始", tutorials: "跟着教程动手", bridgeTitle: "聊清方向。\n也能亲手推进。", bridgeDesc: "想先聊聊，就打开 Personal AI。想直接开工，就进入 Work。两种方式，都能把事情往前推进。", bridge: [
      { label: "从对话开始", body: "说说近况，也能交办一件事。", mode: "Personal AI" },
      { label: "从资料开始", body: "带入文件，直接推进具体工作。", mode: "Work" },
    ], bridgeContinue: "无论从哪里开始，都能检查结果，继续讨论和修改。",
  },
  en: {
    personal: { headline: "A personal Agent.\nYour way.", description: "Talk things through. Share your preferences. When you need a hand, give it something to do.", watch: "Watch Personal AI", film: "Personal AI · From context to a weekly plan", caption: "Real desktop conversation · Work and photography in one week", alt: "Sharing context and response preferences with Personal AI, then continuing the weekly plan discussion", points: [
      { title: "Start with you", body: "Share your background, preferences and what matters now." },
      { title: "Delegate. Keep talking.", body: "Discuss a new idea while the task moves forward." },
      { title: "Review. Keep refining.", body: "Open the file, see the result and decide what comes next." },
    ] },
    work: { headline: "Open your workspace.\nMake it happen.", description: "Bring your files and a goal. Analyze the data, prepare the presentation, and keep the result in your work.", watch: "Watch the full workflow", film: "Work · From source material to a deliverable", caption: "Real outputs · A sales spreadsheet and an editable presentation", points: [
      { title: "Make sense of a spreadsheet", body: "Check the data, summarize monthly sales and see the trend.", alt: "An English spreadsheet delivered by xopc, with monthly sales, orders and totals", chapter: 2, asset: "spreadsheet" },
      { title: "Prepare a presentation", body: "Turn data and conclusions into slides you can edit.", alt: "An English presentation delivered by xopc, with sales figures and a monthly trend chart", chapter: 3, asset: "slides" },
      { title: "Review. Ask for a change.", body: "Refine the presentation to fit your audience and your goal.", alt: "A revised English presentation with three actions to complete before Friday", chapter: 4, asset: "revision" },
    ] },
    choose: "One xopc. Two ways to begin.", personalHint: "Talk things through. Delegate a task.", workHint: "Bring your files. Get to work.", personalTags: "Conversation · Preferences · Delegation", workTags: "Files · Projects · Deliverables", explore: "See what it can do", try: "Download xopc", samples: "Start with a real task", tutorials: "Try a guided tutorial", bridgeTitle: "Talk it through.\nTake it forward.", bridgeDesc: "Start in Personal AI to discuss a goal, or go straight to Work to get hands-on. Both help you move things forward.", bridge: [
      { label: "Start with a conversation", body: "Share what is happening. Give it something to do.", mode: "Personal AI" },
      { label: "Start with your files", body: "Bring your material. Work directly on the task.", mode: "Work" },
    ], bridgeContinue: "Either way, review the result, keep talking and refine the work.",
  },
} as const;
