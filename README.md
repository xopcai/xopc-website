# xopc website

Official landing site for [xopc.ai](https://xopc.ai).

**Keep what matters moving.**

xopc is personal AI for the one-person company. It runs in your environment, remembers your goals and context, and helps move work forward across conversations, tools, and time. Its runtime connects projects, tasks, notes, workflows, and automations across desktop, terminal, web, mobile, and messengers.

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

## Distribution configuration

- `DESKTOP_RELEASE_TAG` and `MOBILE_RELEASE_TAG` optionally pin each independent release channel.
- `IOS_DISTRIBUTION_STATUS` controls iOS distribution: `accepting`, `paused`, `public`, or `released`.
- `IOS_DISTRIBUTION_URL` is required for `public` and `released` iOS states.
- `RELEASE_DOWNLOAD_PUBLIC_BASE_URL` switches release links to a mirrored CDN using `<base>/<tag>/<filename>`.
- `SITE_DATABASE_PATH` sets the SQLite file used for iOS beta signups and anonymous product events.
- `ANALYTICS_ADMIN_USER` and `ANALYTICS_ADMIN_PASSWORD` protect `/admin/analytics` with HTTP Basic Auth.

The default SQLite path is `.data/xopc-website.sqlite3`. Back up that file together with its `-wal`
file while the service is running, or stop the service before copying only the main database file.

## Website analytics

The site records privacy-friendly, first-party product events in the same SQLite database. It uses a
random tab-scoped session ID in `sessionStorage`; no persistent analytics cookie or full referrer URL
is stored. The dashboard shows the latest 30 days at `/admin/analytics` and is unavailable until both
admin credentials are configured.

Client events capture page path, external referrer domain, UTM attribution, locale and coarse device
type. Successful iOS beta signups and installation-package requests are recorded on the server. Raw
events are retained for 180 days.

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

The homepage follows one illustrative project through context recovery, a human decision,
visible progress, and continuing on a phone. Passive readers see a complete example,
explicitly labeled as an outcome after approval. Optional confirmation demonstrates
feedback without executing any live task; confirming again goes to the result rather
than silently undoing the decision. Desktop scenes stay mounted and crossfade within
one workspace, with a persistent launch-plan summary linking the chapters.
The hero leads with the brand slogan, paper notes and interactive Loopi. Its existing
SVG motion responds to pointer/tap input and pauses offscreen or for reduced motion.
The full localized walkthrough remains available below the story; product imagery does
not displace the warm, companion-led brand introduction.

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

The homepage retains its work-focused story and full localized product walkthrough.
Ada is xopc's personal Agent, introduced through a dedicated menu and `/zh/ada`
and `/en/ada`. It starts with personal context, then discussion, delegation and an
inspectable result. Ada belongs to xopc and shares its download and controls.

- Ada page and bilingual copy: `components/ada-page.tsx`, `lib/ada-copy.ts`
- Ada media resolver and release: `lib/ada.ts`, `content/ada/manifest.json`
- Video: `public/media/product/ada/v1/{zh-CN,en-US}/`
- Reviewed localized previews and provenance: `content/ada/previews.json`
- Narrative and maintenance: `content/marketing/ada.md`
- Editable source: sibling `xopc-tutorials/videos/xopc-personal-agent-intro/`

Synchronize verified Ada deliveries with `node scripts/sync-ada.mjs
../xopc-tutorials/videos/xopc-personal-agent-intro/delivery/ada/v1`.
Use `node scripts/sync-ada-previews.mjs` for reviewed previews. Both scripts
verify hashes and preserve immutable published versions. Raw captures, credentials,
fonts and logs remain private. Media uses Git LFS.

Ada videos open only after a click in the centered, keyboard-accessible
`ProductFilmButton` modal. Closing removes the player and returns focus. Each
locale selects its own real conversation, narration, captions and previews;
section buttons seek to corresponding release chapters. Visible subtitles are
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
