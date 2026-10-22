# Homepage launch film · V5

Published October 22, 2026. 52 seconds, 1920×1080, 30fps, H.264/AAC. The homepage hero, inline player and chapter shortcuts use `launchFilm(locale)`. Existing Work, Ada, official introduction and tutorial releases retain their original URLs.

The film follows a fictional creator preparing a product launch: provide project files, review a launch page, take a break, return to the same project, shorten the headline and review two promo cards. Native XOPC desktop recordings show actual file operations and previews. The supplied HTML template and final layout were designed for the demonstration; it is not a claim of unedited, from-scratch model output. The next-day sequence is staged. Loopi lifestyle footage was generated in MiniMax using the official reference. No demo content was actually published or sent.

Both locales share the same film. On-screen product UI is Chinese. The English page explicitly labels this and offers an optional English caption track; no English narration is implied. Caption tracks describe the music-led story and are off by default to avoid duplicating on-screen text.

Assets live in the immutable `/media/product/launch/v5/` directory, tracked with Git LFS. `content/launch/manifest.json` records dimensions, chapters and SHA-256 hashes. The video is remuxed losslessly with `+faststart` for progressive playback. It loads only on user interaction (`preload="none"` inline; metadata in an opened modal). Four small chapter stills are extracted from the actual delivered film and lazy-loaded through Next Image.

Source delivery: `~/Documents/XOPC-Promo/XOPC-接着向前-V5-明亮连贯版.mp4`. Editable source: the `videos/xopc-launch/` project in the October 21 Codex visualization workspace; delivered separately as `XOPC-V5-可编辑工程.zip`. Raw captures, editing sources and logs are not published on the website.

For future revisions, create a new version directory, update the manifest and caption timing, then verify both locale pages, playback, seeking, keyboard dismissal/focus return, phone layout and HTTP range requests.
