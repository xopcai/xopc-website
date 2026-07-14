# xopc website

Official landing site for [xopc.ai](https://xopc.ai).

xopc is a self-hosted, local-first personal AI runtime. It connects models, agents, persistent sessions, projects, goals, notes, workflows, and automations across CLI, desktop, web, mobile, and messengers.

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

## Content map

- Landing page copy: `messages/en.json` and `messages/zh.json`
- Landing page structure: `components/landing-page.tsx`
- Landing styles: `app/styles/landing/`
- Download/release proxy routes: `app/api/download/` and `app/api/github/latest-release/`

The primary product repository is [xopcai/xopc](https://github.com/xopcai/xopc).
