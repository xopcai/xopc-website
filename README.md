# xopc website

Official landing site for [xopc.ai](https://xopc.ai).

**A better life, with AI.** / **AI，让生活更美好。**

xopc is an open-source, local-first personal AI assistant for work and everyday life. It remembers relevant context and works with authorized tools to help you think things through and get things done—with more time to create and enjoy life.

Our vision is a future where everyone has their own AI assistant, with more time to create, be with the people who matter, and enjoy the world around them. Our mission is to build AI that learns each person’s habits, goals, and circumstances and takes on more tedious, repetitive, and time-consuming tasks. How people spend the time is up to them.

愿景：让每个人都能拥有自己的 AI 助理，在工作与生活中获得持续的帮助，有更多时间去创造、陪伴重要的人，体验和享受生活。

使命：让 AI 逐渐理解每个人的习惯、目标与处境，承担更多繁琐、重复和耗时的事务，帮助人们把想法付诸行动，也把时间和精力留给自己在意的事。

The same xopc supports conversations with Ada and direct work with files and projects. It runs on a computer the user chooses, with access across desktop, terminal, web, mobile, and messengers. Available capabilities depend on configured models, tools, and permissions.

Canonical vision and mission: [中文](https://xopcai.github.io/xopc/zh/product) · [English](https://xopcai.github.io/xopc/product).

## Local development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Useful commands

```bash
pnpm lint
pnpm build
```

## Production deployment

Run `bash scripts/deploy.sh` with `XOPC_SERVER` configured and a local Docker engine running. The script builds on the client in a Linux container, uploads the production `.next` output, installs only production dependencies on the server, and reloads PM2. It never runs a server-side build. Existing server secrets and `.data` are preserved.

The default build target is `linux/amd64` with Node 24.14.1, matching production. Override `XOPC_BUILD_PLATFORM` and `XOPC_BUILD_IMAGE` when the server platform or Node version changes. The container uses the production path so native dependency references resolve on the server.

## Distribution configuration

- `DESKTOP_RELEASE_TAG` and `MOBILE_RELEASE_TAG` optionally pin each independent release channel.
- `IOS_DISTRIBUTION_STATUS` controls iOS distribution: `accepting`, `paused`, `public`, or `released`. When unset, the website uses the public TestFlight invitation at https://testflight.apple.com/join/mGu7DU1T. Mobile visitors can join directly; desktop visitors also see a QR code for their iPhone or iPad.
- `IOS_DISTRIBUTION_URL` is required for `public` and `released` iOS states.
- `RELEASE_DOWNLOAD_PUBLIC_BASE_URL` switches release links to a mirrored CDN using `<base>/<tag>/<filename>`.
- `SITE_DATABASE_PATH` sets the SQLite file used for iOS and HarmonyOS beta signups and anonymous product events.
- `ANALYTICS_ADMIN_USER` and `ANALYTICS_ADMIN_PASSWORD` protect `/admin/analytics` with HTTP Basic Auth.

The default SQLite path is `.data/xopc-website.sqlite3`. Back up that file together with its `-wal`
file while the service is running, or stop the service before copying only the main database file.

## Website analytics

The site records privacy-friendly, first-party product events in the same SQLite database. It uses a
random tab-scoped session ID in `sessionStorage`; no persistent analytics cookie or full referrer URL
is stored. The dashboard shows the latest 30 days at `/admin/analytics` and is unavailable until both
admin credentials are configured.

Client events capture page path, external referrer domain, UTM attribution, locale and coarse device
type. Successful iOS and HarmonyOS beta signups and installation-package requests are recorded on the server. Raw
events are retained for 180 days.

Declarative CTA clicks are handled once in `SiteAnalytics`, including direct visits to Ada.
`ada_download_clicked` measures download intent, separately from installation-package requests.
Films record `film_opened` for modal opens, `film_started` on actual playback, and `film_completed`
only when playback ends with at least 90% of the duration present in the browser's played ranges.
Seeking to the end does not count as completion. `method` distinguishes the Work hero, inline
overview, Ada introduction and chapter entries. Pause/resume is deduplicated
within a mounted player; reopening a modal starts a new viewing. Locale changes reset the player.
Run `node --test scripts/test-website-analytics.mjs` to verify CTA routing, playback counting and
server acceptance. Website events do not prove successful installation or product activation.
Mobile-menu download intents and terminal copy clicks use the same delegated listener.
HEAD probes and failed installation-package responses do not record `download_started`.

The production deploy script installs a user crontab that sends a Telegram summary every day at
09:00 Asia/Shanghai. It reuses `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`; preview the message without
sending it with `pnpm analytics:report:dry-run`, or send immediately with `pnpm analytics:report`.

## Content map

- Homepage story copy (Chinese and English): `lib/landing-story-copy.ts`
- Shared navigation, downloads, and product copy: `messages/en.json` and `messages/zh.json`
- Landing page structure: `components/landing-page.tsx`
- Interactive four-chapter story: `components/landing-story.tsx`
- Homepage-specific styles: `components/landing-story.module.css`
- Landing styles: `app/styles/landing/`
- Product-aware download resolution: `app/api/downloads/resolve/`
- Release download proxy routes: `app/api/download/`
- Pinned Whisper and SenseVoice model proxy/cache: `app/api/voice/models/`

The primary product repository is [xopcai/xopc](https://github.com/xopcai/xopc).

## Homepage story

The homepage retains its companion-led introduction and continuous story. A quiet real-demo
button below the hero actions opens Work v2 directly, while the inline film remains after the
story to preserve the reading flow. Ada’s page clarifies task delegation within the same app.

The homepage follows one illustrative project through context recovery, a human decision,
visible progress, and continuing on a phone. Passive readers see a complete example,
explicitly labeled as an outcome after approval. Optional confirmation demonstrates
feedback without executing any live task; confirming again goes to the result rather
than silently undoing the decision. Desktop scenes stay mounted and crossfade within
one workspace, with a persistent launch-plan summary linking the chapters.
The hero leads with the brand slogan, paper notes and interactive Loopi. Its existing
SVG motion responds to pointer/tap input and pauses offscreen or for reduced motion.
A concise bilingual Work v2 film follows the story: files → editable spreadsheet and
presentation → revision. The full onboarding walkthrough remains on learning pages.

On wide, tall viewports, the workspace stays in view while scrolling through the four
chapters. Phones, short viewports, and pages without JavaScript use an inline scene per
chapter. Reduced-motion preferences disable decorative motion and smooth chapter jumps.
The device mockup is drawn in CSS/SVG; Loopi reuses the existing brand component.
Desktop downloads retain device detection and platform
selection; Android downloads, iOS access and terminal installation remain available below.
The standalone mobile and product pages have been removed. Their legacy URLs redirect
to the homepage download sections; they are no longer listed in the sitemap.

Android release discovery persists verified metadata to `.data/github-mobile-release.json`.
Requests are deduplicated, timed out after eight seconds, and backed off for one minute
after a failed attempt. A verified snapshot may be used for up to seven days during an
upstream outage, including after a server restart. An explicitly pinned tag never uses
a different cached release. Cold-cache failures retain platform context, a retry button
and an official fallback link. Error responses are not HTTP-cached; client requests time
out after twelve seconds. QR codes use a keyboard/touch-accessible disclosure.
Run `node --test scripts/test-mobile-release.mjs` for isolated cache/failure-path tests.

Desktop resolution reports `assets-pending` when the selected release has no installer for
that platform, rather than returning an empty successful response during a partial upload.
Loading and error states retain platform switching, and errors provide retry and official
release-page links. Run `node --test scripts/test-desktop-downloads.mjs` for this regression.

## Product map

The default explorer is prerendered for both languages and can be prefetched as a
static route. Query-string initialization lives in `product-map-query.tsx` behind
Suspense; its fallback is the complete default explorer, not a blank loading screen.
Search, group, view and node links initialize in the browser without forcing a new
server render. Without JavaScript, the default overview remains readable.

The native product explorer lives at `/zh/product-map` and `/en/product-map`, with desktop and mobile navigation links. It reuses the site's theme, language control and desktop demo video. Locale switching retains `view`, `node`, `q` and `group` URL parameters.

- `lib/product-map/manifest.json`: stable feature IDs, hierarchy, relations, guides and journeys.
- `messages/product-map/{zh,en}.json`: full localized content and interface copy. Keep the two files structurally identical.
- `components/product-map/`: React explorer and interactive mind map.
- `node scripts/check-product-map.mjs`: verify translation parity, placeholders, feature coverage and graph references.

The public map links to localized product guides where available and labels English-only references. Experimental and evolving capabilities are explicitly marked. Update both languages when product capabilities change. Canonical and language-alternate URLs are defined on the route, and both locales are included in the sitemap.

## Short product films

The homepage leads with the 52-second Loopi launch film, followed by the interactive
launch-plan story. The hero, inline player and four chapter shortcuts share one
versioned release. Both locales use the same Chinese-UI, music-led film with localized
optional caption tracks; the English page labels the source language.
Ada is xopc's personal Agent, introduced through a dedicated menu and `/zh/ada`
and `/en/ada`. It starts with personal context, then discussion, delegation and an
inspectable result. Ada belongs to xopc and shares its download and controls.

- Ada page and bilingual copy: `components/ada-page.tsx`, `lib/ada-copy.ts`
- Interactive companion: `components/ada-companion.tsx`, reusing animated Loopi
- Homepage launch film: `lib/launch-film.ts`, `content/launch/manifest.json`, `public/media/product/launch/v5/`
- Release provenance and maintenance: `content/marketing/launch-film.md`
- Previous Work film: `lib/work-film.ts`, `content/work/manifest.json`, `public/media/product/work/v2/`
- Ada media resolver and release: `lib/ada.ts`, `content/ada/manifest.json`
- Current lifestyle video: `public/media/product/ada/v2/` (v1 preserved)
- Reviewed localized previews and provenance: `content/ada/previews.json`
- Narrative and maintenance: `content/marketing/ada.md`
- Editable source: sibling `xopc-tutorials/videos/xopc-personal-agent-intro/`

Synchronize verified Ada deliveries with `node scripts/sync-ada.mjs
../xopc-tutorials/videos/xopc-personal-agent-intro/delivery/ada/v1`.
Use `node scripts/sync-ada-previews.mjs` for reviewed previews. Both scripts
verify hashes and preserve immutable published versions. Raw captures, credentials,
fonts and logs remain private. Media uses Git LFS.

Ada videos open only after a click in the centered, keyboard-accessible
`ProductFilmButton` modal. Closing removes the player and returns focus. Both
locales now share the v2 Chinese-interface lifestyle film with localized optional captions;
section buttons seek to corresponding release chapters. Visible titles are
embedded; optional tracks are off by default to avoid duplicate text.

Previous Personal AI and Work releases remain available at their original URLs.
Their former homepage narrative is documented in
`content/marketing/personal-ai-work.md`. Legacy `#personal-ai` links redirect to
the localized Ada page; `#work` links redirect to the restored homepage film.

The learn page features the 45-second portrait office overview at
`/zh/learn?course=office-overview` (and `/en/learn?course=office-overview`).
Published assets live in `public/media/promos/office-overview/v1/zh-CN/`:
`video.mp4`, `poster.jpg`, and `captions.vtt`, tracked with Git LFS.
The editable composition, narration and source manifest remain in the sibling
`xopc-tutorials/videos/xopc-office-promo/` project. Publish revisions in a new
version directory and update `promoMedia` in `components/learn/course-library.tsx`.
Both locales use Chinese narration, explicitly labeled in the player.

## Inside xopc engineering blog

The blog lives at `/zh/blog` and `/en/blog`. Article bodies are authored in
`content/blog/<slug>/zh.md`, with metadata in frontmatter and portable illustrations
under the adjacent `images/` directory. A shared Markdown renderer handles
typography, captions, tables and responsive light/dark diagrams. See
[the authoring guide](content/blog/README.md). Each article has Chinese and English Markdown, localized illustrations and
share artwork, reciprocal language links, and a canonical URL for each language.
Articles focus on concrete problems, design decisions, and trade-offs. The published registry in
`lib/blog.ts` drives the index, article routes and sitemap. New social artwork
lives beside each article in `content/blog/<slug>/images/`.

## HarmonyOS invited beta

The homepage mobile-download section (`#harmony-beta`) accepts mainland China mobile numbers
linked to Huawei accounts, including optional `+86` or `0086` prefixes. `/api/beta-signups`
accepts `program: "harmony-invited-test"` with `phone`, `locale`, and `source`.
Requests are deduplicated in `harmony_beta_signups`, leaving existing iOS records untouched.
The existing `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` send the phone number to the team
for manual addition to the Huawei testing group. A failed notification returns a retryable
error; resubmitting a saved, unnotified number retries delivery. Notified requests do not
send another notification on later submissions. Run `node --test scripts/test-beta-signups.mjs`.
