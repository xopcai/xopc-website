# Public website structure

The main journey is overview → practical workflows → product capabilities → documentation.

- `components/site-header.tsx` owns public navigation. Keep Product map immediately before Docs. Locale switching preserves the route and map/course query state.
- `components/landing-page.tsx` introduces the desktop demo, three workflow steps, selected scenarios, control principles, and downloads.
- `components/learn/course-library.tsx` presents practical workflows. Instructions, videos, captions, and practice files stay in the course drawer.
- `components/product-map/product-map.tsx` starts with one phase. Horizontal categories expose all capabilities; search covers all phases. Mind map is a primary alternative; architecture and the full catalog live under More.
- `app/site.css` owns the shared visual treatment and responsive overrides. Route styles own specialized components such as the mind-map canvas and tutorial player.
- `messages/product-map/{zh,en}.json` owns map copy. Short landing/header copy is paired by locale in the corresponding components. Keep both languages in sync.

## Editorial rules

Use one clear heading, a short supporting line, and a visible next action. Prefer steps, product imagery, and progressive disclosure over repeated paragraphs. Preserve instructions and capability boundaries inside drawers. Do not shorten legal policies for marketing purposes.

## Media

Keep tutorial releases immutable under `public/media/tutorials`. Their catalog, hashes, and publication checks belong to the tutorial pipeline. The homepage poster `public/media/product/xopc-desktop-poster.jpg` is an unmodified frame at 18 seconds from `xopc-desktop.mp4`. Update the poster with its source demo. Product media is tracked with Git LFS.

## Verification

Run `pnpm run lint`, `pnpm exec tsc --noEmit`, and `pnpm build`. Check Chinese and English, light and dark themes, mobile width, search, category changes, map views, locale preservation, and drawer playback/closing. The existing deployment script builds on the production platform and reloads the service.
