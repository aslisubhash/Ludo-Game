# Ludo Universe

A portrait-first (9:16) social Ludo game for the web. It is plain HTML, CSS and ES modules with no build step and no dependencies.

## Run

```bash
python3 -m http.server 8765    # any static server works
open http://localhost:8765
```

URL flags: `?fast` skips the splash and welcome popups, `?nosw` disables the service worker, `?offline` simulates a dropped connection after 4 s, `?turbo` compresses scripted delays (tests only), `?screen=play` opens a specific tab.

## Tests

```bash
node tests/rules.test.mjs                       # rules engine, fair die, 400 bot-vs-bot games
python3 -m http.server 8765 & node tests/smoke.mjs shots   # headless Chromium: every screen + a full match
```

## What's in it

| Area | Where |
| --- | --- |
| Rules engine (pure, Node-testable) | `js/game/rules.js` |
| Personality-weighted AI | `js/game/ai.js` |
| Turn controller (never alters dice) | `js/game/match.js` |
| SVG board, 13 skins, DOM tokens with lift/hop/trail/capture | `js/game/board-view.js` |
| Signature 3D dice (compress → launch → tumble → bounce → land) | `js/game/dice.js` |
| Tension presentation from real state only | `js/game/tension.js` |
| 500+ characters, presence simulation | `js/content/characters.js` |
| 21 personality archetypes, English and Hinglish chat pools | `js/content/personalities.js` |
| Procedural illustrated avatars (fallback and placeholder) | `js/content/avatar.js` |
| Cosmetics, level road, daily track, missions | `js/content/catalog.js` |
| Festival and live events, theming | `js/content/events-calendar.js` |
| OTA content loader | `js/content/ota.js`, `content/manifest.json` |
| Rewarded ads layer with fairness guards | `js/ads/ads.js` |
| Screens | `js/screens/*` |

## Characters

Every character is a fictional game character. The cast is generated deterministically from a seed, with a name, personality, level, stats, bio, mood, favourite token colour and achievements. It scales to 10,000+ by raising `characters.count` in the manifest. Opponents are played locally by the personality-weighted AI.

**Photorealistic portraits** are generated with Higgsfield (`soul_2`, 150 so far: characters 0–149) and are listed in `content/portraits.json`, keyed by character index. Indexes 0–4 are the hero cast: Riya, Meera, Tanya, Ananya and Kavya. Characters without a portrait use the procedural SVG avatar, which is also the instant fallback if a portrait fails to load. To add more, append `{ index, url }` entries; the app picks them up via OTA with no release. The portrait URLs are hosted on Higgsfield's CDN. To self-host them, download the files into `assets/portraits/` and point the URLs there.

## Fair play

- Dice use `crypto.getRandomValues` with rejection sampling (`fairDie()` in `js/core/rng.js`). The value is decided before the animation starts.
- **Second chance** (the only in-match ad) follows one published rule. Once per match, in the final stage (any player has 2 tokens home or a token in a home column), if your roll has no legal move you may watch an optional ad for one extra roll. The decline button is always visible.
- `showRewarded()` refuses to run while dice roll, a token moves or a move must be chosen. It also enforces a cooldown and a daily cap. Other placements happen only at natural breaks: double the match reward, daily bonus, mystery box, double a mission reward, try premium dice.
- Mystery box odds are shown in the UI.

To plug in a real ad network, call `setAdProvider({ name, isReady(), show(placement) })` from `js/ads/ads.js`, for example with an H5 Games Ads `adBreak` adapter or a WebView bridge to AdMob.

## OTA content

`content/manifest.json` is fetched network-first on every launch and cached for offline use. It can:

- grow the cast and flag new characters
- add portraits
- add or force live events
- add home banners
- append catalog items
- add missions
- publish "What's new" notes, shown once per version
