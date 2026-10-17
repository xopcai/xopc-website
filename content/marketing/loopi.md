# Loopi in xopc

## Information architecture

- xopc home restores the work story from commit 0520e73. It explains continuity, context, decisions and deliverables, then presents the concise Work v2 introduction through actual editable results.
- Loopi is a named personal Agent inside xopc. The global Loopi menu opens /zh/loopi or /en/loopi, with active navigation, corresponding language switching and localized metadata.
- Loopi has its own story: meet Loopi → share context → discuss → delegate → inspect and revise → download xopc. It does not require a second installation or a mandatory transfer to Work.
- The footer, sitemap and localized canonical/alternate URLs expose both pages. Legacy home #personal-ai links resolve to the corresponding Loopi page; #work links resolve to the restored product film.

## Reference and claims

Reference: https://chatgpt.com/zh-Hans-CN/codex/ and https://chatgpt.com/zh-Hans-CN/features/dots/ . Apply their named-agent positioning, focused product pages and scenario-first explanation. Use original xopc copy and existing actual xopc captures, without importing another product's promises, graphics or testimonials.

Loopi's overview shows the authentic weekly-plan workflow already recorded in both languages. State clearly that Loopi is included in the xopc desktop application and needs a connected model provider. Core state stays local; cloud providers process request context when used. Do not claim a separate cloud computer, offline inference, permanent background operation, autonomous purchases or calendar access.

## Maintain

- Page: components/loopi-page.tsx; localized copy: lib/loopi-copy.ts.
- Film selection: content/ada/manifest.json and lib/loopi-film.ts.
- Source: xopc-tutorials/videos/xopc-personal-agent-intro; the historical bilingual Ada recording is delivered under delivery/ada/v1. The earlier personal-ai/v3 release remains unchanged.
- Sync films with scripts/sync-ada.mjs; sync original screenshot previews with scripts/sync-ada-previews.mjs. Published bytes are immutable; use a new version for future updates.
- Keep captured product UI authentic. Loopi is the public agent name and the default name in xopc. Existing custom profile names remain unchanged.


## Companion revision

Loopi’s introduction pairs the existing Loopi ceramic brand character with a warm bilingual greeting and three clearly scripted conversation prompts. Tap and keyboard activation share the same response. Animation retains Loopi’s reduced-motion, offscreen and hidden-tab suspension. The actual localized dialogue, delegation and output screenshots remain below the greeting; this interaction does not send a model request or collect user input. Homepage uses the updated Work v2 film to explain xopc through real editable spreadsheet and presentation results; learning retains the full onboarding walkthrough.

## Rename compatibility

The former /zh/ada and /en/ada URLs permanently redirect to /zh/loopi and /en/loopi. Published media and provenance under content/ada and /media/product/ada remain immutable. The localized page identifies these recordings as predating the rename; their captions and recorded UI retain Ada.
