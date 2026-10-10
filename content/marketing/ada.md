# Ada in xopc

## Information architecture

- xopc home restores the work story and original product introduction from commit 0520e73. It explains continuity, context, decisions and deliverables.
- Ada is a named personal Agent inside xopc. The global Ada menu opens /zh/ada or /en/ada, with active navigation, corresponding language switching and localized metadata.
- Ada has its own story: meet Ada → share context → discuss → delegate → inspect and revise → download xopc. It does not require a second installation or a mandatory transfer to Work.
- The footer, sitemap and localized canonical/alternate URLs expose both pages. Legacy home #personal-ai links resolve to the corresponding Ada page; #work links resolve to the restored product film.

## Reference and claims

Reference: https://chatgpt.com/zh-Hans-CN/codex/ and https://chatgpt.com/zh-Hans-CN/features/dots/ . Apply their named-agent positioning, focused product pages and scenario-first explanation. Use original xopc copy and existing actual xopc captures, without importing another product's promises, graphics or testimonials.

Ada's overview shows the authentic weekly-plan workflow already recorded in both languages. State clearly that Ada is included in the xopc desktop application and needs a connected model provider. Core state stays local; cloud providers process request context when used. Do not claim a separate cloud computer, offline inference, permanent background operation, autonomous purchases or calendar access.

## Maintain

- Page: components/ada-page.tsx; localized copy: lib/ada-copy.ts.
- Film selection: content/ada/manifest.json and lib/ada.ts.
- Source: xopc-tutorials/videos/xopc-personal-agent-intro; the bilingual Ada revision is delivered under delivery/ada/v1. The earlier personal-ai/v3 release remains unchanged.
- Sync films with scripts/sync-ada.mjs; sync original screenshot previews with scripts/sync-ada-previews.mjs. Published bytes are immutable; use a new version for future updates.
- Keep captured product UI authentic. Ada is the public agent name; this website update does not alter the desktop application's interface labels.
