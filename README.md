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

- Landing page copy: `messages/en.json` and `messages/zh.json`
- Landing page structure: `components/landing-page.tsx`
- Landing styles: `app/styles/landing/`
- Product-aware download resolution: `app/api/downloads/resolve/`
- Release download proxy routes: `app/api/download/`
- Pinned Whisper and SenseVoice model proxy/cache: `app/api/voice/models/`

The primary product repository is [xopcai/xopc](https://github.com/xopcai/xopc).

## Product map

The native product explorer lives at `/zh/product-map` and `/en/product-map`, with desktop and mobile navigation links. It reuses the site's theme, language control and desktop demo video. Locale switching retains `view`, `node`, `q` and `group` URL parameters.

- `lib/product-map/manifest.json`: stable feature IDs, hierarchy, relations, guides and journeys.
- `messages/product-map/{zh,en}.json`: full localized content and interface copy. Keep the two files structurally identical.
- `components/product-map/`: React explorer and interactive mind map.
- `node scripts/check-product-map.mjs`: verify translation parity, placeholders, feature coverage and graph references.

The public map links to localized product guides where available and labels English-only references. Experimental and evolving capabilities are explicitly marked. Update both languages when product capabilities change. Canonical and language-alternate URLs are defined on the route, and both locales are included in the sitemap.

## Short product films

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
`content/blog/`, with metadata in `lib/blog.ts` and responsive, accessible diagrams
in `components/blog/`. The first article is Chinese-only; the English index labels
that explicitly, and its English article URL redirects to the Chinese original.
Do not add an English article language alternate until a translation is published.
Source links are pinned to the xopc revision reviewed for the article. Add published
article URLs to `app/sitemap.ts`; social artwork lives in `public/media/blog/`.
