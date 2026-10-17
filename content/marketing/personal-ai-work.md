# One xopc, two ways to begin

Status: historical homepage design, superseded by the restored work homepage and dedicated Ada pages. See `content/marketing/ada.md` for the current architecture. These published media versions remain immutable and available; the release allowlists and QA evidence live in the maintained tutorial repository.

## Narrative

Definition → two equal entry points → a real Personal AI scenario → a real Work workflow → freedom to choose either entry → control and data boundaries → one download CTA.

- **你的个人 Agent。也是你的工作空间。** / **Your personal Agent. Your workspace, too.**
- Personal AI starts with the person: context, preferences, discussion, delegation and an inspectable result. It can take action, not just talk.
- Work starts with the task: bring files, set a goal, inspect a deliverable and ask for a revision.
- These are two ways to engage with one xopc. They are not two products or a mandatory sequential handoff. The website presents them in parallel and the films refer back to the same download.

## Published introductions

| Film | Real scenario | Release | Source |
| --- | --- | --- | --- |
| Personal AI | A week with a Friday sales update, twenty minutes a day and phone photography at the weekend; delegate a one-page plan, inspect it and revise the photography section | personal-ai v3, zh-CN and en-US | xopc-tutorials/videos/xopc-personal-agent-intro/ |
| Work | A six-row fictional sales CSV; check data, produce editable XLSX and PPT, then simplify the final slide to three actions before Friday | work v1, zh-CN and en-US | xopc-tutorials/videos/xopc-work-intro/ |

Each locale uses its own real conversation and localized outputs, measured Cherry narration, visible captions and optional VTT. The clean layout emphasizes the relevant original pixels; UI text is never replaced in screenshots. No extra corner branding or black slide letterboxing. Video masters are 3840×2160, 30 fps, about one minute each.

The home page opens a centered video modal only after a click. Work cards follow the film's order (spreadsheet → presentation → revision) and use chapter times from the locale's release manifest. Language changes select matching narration, poster, captions and screenshot previews. The parallel summary makes choosing an entry explicit.

## Evidence and boundaries

The Personal AI plan was really created and revised in xopc. The English revision was re-opened through the desktop application's file preview for a readable capture. The Work spreadsheet and presentation were really generated from the CSV; the PPT was opened in Keynote to verify editable native shapes and charts. Monthly revenue is 78,000 / 84,000 / 93,000, total 255,000, orders 728. The source does not specify currency or year, and the outputs retain that uncertainty. It is fictional demonstration data.

Safe crop ledgers and source artifact hashes are stored with each source project. Strict composition validation, ASR, full video decoding, exact release hashes and all-clip audio synchronization are checked before publication; contact sheets are inspected across all scenes. No unverified voice call, cross-session memory, calendar integration, external messages or always-on/offline inference is claimed.

## Maintenance

- Personal AI export: scripts/sync-personal-ai.mjs → content/personal-ai/manifest.json and public/media/product/personal-ai/v3/.
- Work export: scripts/sync-work-film.mjs → content/work/manifest.json and public/media/product/work/v1/.
- Reviewed image export: scripts/sync-experience-previews.mjs → content/marketing/experience-previews.json and public/media/product/experiences/v2/.
- Only approved MP4/JPG/VTT and optimized safe crops go to the website. Keep raw desktop captures, logs, fonts and credentials private. New revisions require new immutable release versions.
- The previous Personal AI v2 and official introduction v3 assets remain available. Full onboarding and existing scenario tutorials remain in learning and product exploration.
- Run website lint/build; check zh/en, desktop/mobile, modal close/focus, localized media, chapter seeking and live HTTP 206 range requests after deployment.

The execution/results emphasis of Codex and the personal relationship of dots informed the structure. Their infrastructure capabilities are not claims about xopc.
