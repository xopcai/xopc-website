# Official product introduction

The homepage and product exploration video share `lib/product-intro.ts` and
`components/product-intro-video.tsx`. The introduction card precedes Onboarding.
Website locales `zh` and `en` select independent narration, posters and captions.

Published assets: `public/media/product/official-intro/v1/{zh-CN,en-US}/`.
Each directory contains `video.mp4`, `poster.jpg` and `captions.vtt`, managed by
the repository's existing Git LFS rules. Videos have embedded visible subtitles;
optional caption tracks support browser accessibility controls.

Production source: sibling repository
`xopc-tutorials/videos/xopc-official-intro/` (README, bilingual story, narration,
compositions, source materials and QA). Copy only reviewed delivery assets here.
Chinese: 203.6 seconds. English: 214.967 seconds. Both are 1080p H.264/AAC.

For a new release, add a version directory and update the shared resolver. Verify
both language routes, posters, caption requests, playback and modal close behavior
before publishing. Keep old version paths available for cached pages.
