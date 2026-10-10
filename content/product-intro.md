# Official product introduction

`lib/product-intro.ts` selects the localized full introduction. The product exploration
introduction card precedes Onboarding; the learning page preserves the walkthrough.
The restored homepage also presents this full introduction below its work story.
Ada has a separate localized introduction at `/zh/ada` and `/en/ada`.

Published assets: `public/media/product/official-intro/v3/{zh-CN,en-US}/`.
Each contains `video.mp4`, `poster.jpg` and `captions.vtt`, managed by Git LFS.
Videos have embedded visible subtitles; optional captions are not enabled by default.
Website locales select independent narration, posters and captions. Existing document
contents in this older full introduction remain Chinese. Ada’s focused introduction uses separate English conversations and outputs.

Production source: sibling repository `xopc-tutorials/videos/xopc-official-intro-v3/`.
Copy only reviewed delivery assets. Chinese: 214.866667 seconds. English: 218.633333
seconds. Both are 3840×2160 H.264/AAC, based on the actual published files.

Add a new immutable version and update the shared resolver for revisions. Verify both
language routes, byte ranges, posters, captions, playback, chapter timing and modal
close behavior. Preserve old paths for cached pages. See
`content/marketing/personal-ai-work.md` for the completed focused Work introduction.
