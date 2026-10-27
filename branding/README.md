# FreeScript brand & promotional kit

Start with [Brand guidelines](BRAND-GUIDELINES.md), [launch copy](PROMOTIONAL-COPY.md), and [asset provenance](ASSET-MANIFEST.md).

The `logos/` folder contains vector/PNG identity assets and the original app icon. `screenshots/` contains real app captures using fictional writing. `promotional/` contains final PNG/GIF designs and their reusable HTML templates. `video/` contains two silent captioned MP4s, WebVTT captions, and timeline source files.

![FreeScript brand system](promotional/brand-overview.png)

## Rebuild from the FreeScript repository root

Install the app development dependencies and have FFmpeg available. The capture uses a temporary app library and never the user's actual manuscripts.

```sh
npm ci
npm run build
node branding/scripts/capture-demo.mjs
node branding/scripts/build-brand.mjs
node branding/scripts/render-brand.mjs
node branding/scripts/render-video.mjs
node branding/scripts/build-video.mjs
```

Set `FREESCRIPT_FFMPEG` to a full FFmpeg executable path if it is not on PATH. Rendering uses Electron/Playwright. The AI-generated campaign photograph is included; rebuilding layouts does not regenerate that photograph. The prompt and tool provenance are in the asset manifest.

HTML templates are sources; final PNGs and MP4s are ready for use. Keep this directory structure if you open or adapt a template locally. View MP4s in a video player. Both contain visible captions and also include companion `.vtt` files for web players.
