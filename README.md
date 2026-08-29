# xopc website

Official landing site for [xopc.ai](https://xopc.ai).

xopc is an open-source, local-first personal AI on your computer that remembers your goals and context—and picks up where you left off. Its runtime connects conversations, projects, tasks, notes, workflows, and automations across desktop, terminal, web, mobile, and messengers.

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

The default SQLite path is `.data/xopc-website.sqlite3`. Back up that file together with its `-wal`
file while the service is running, or stop the service before copying only the main database file.

## Content map

- Landing page copy: `messages/en.json` and `messages/zh.json`
- Landing page structure: `components/landing-page.tsx`
- Landing styles: `app/styles/landing/`
- Product-aware download resolution: `app/api/downloads/resolve/`
- Release download proxy routes: `app/api/download/`
- Pinned Whisper and SenseVoice model proxy/cache: `app/api/voice/models/`

The primary product repository is [xopcai/xopc](https://github.com/xopcai/xopc).
