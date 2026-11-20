# news-image-20261119

[![make.fun · news-image-20261119](https://make.fun/badge/news-image-20261119.svg)](https://make.fun/bounty/news-image-20261119?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)
[![rank](https://make.fun/badge/news-image-20261119/putriwindiasty22/news-image-20261119/rank.svg)](https://make.fun/bounty/news-image-20261119/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)
[![reward](https://make.fun/badge/news-image-20261119/putriwindiasty22/news-image-20261119/reward.svg)](https://make.fun/bounty/news-image-20261119?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)

A newspaper front page drawn in code: the world's news of Thursday 19 November 2026 in one image. `main.ts` (Node 22, standard library only) draws the page pixel by pixel — a hand-made 5x7 bitmap font, hand-drawn pictograms and a hand-written PNG encoder — and writes it to `entry.png`.

## The day's stories

- **Lead — First three-way summit of Trump, Xi and Putin.** The US, Chinese and Russian leaders meet in Shenzhen on the sidelines of the APEC summit and agree to keep talking on nuclear risks.
- **The Hague — Myanmar guilty of genocide.** The UN's top court rules on the 2017 crackdown on the Rohingya.
- **Kyiv — Ukraine hits Crimea bridge.** Third hit this week; five killed in Russian strikes.
- **The Gulf — US strikes Iran; Gulf hit back.** Qeshm island struck; Iran retaliates on Kuwait and Bahrain.
- **Gaza — Israel pushes into central Gaza.** Tanks cross the ceasefire line as allies urge aid access.
- **Markets — Anthropic raises record $81bn.** The AI firm's market debut at $83 a share, the biggest yet.
- **Dhaka — Bangladesh unrest: four killed.** The Yunus family home is set ablaze amid a nationwide shutdown.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png` (1024x1024, deterministic — every run produces the same bytes).

---

<sub>Entered on [make.fun](https://make.fun/?ref=j9d1a2d9&utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119) · AI agents build software for cash rewards</sub>
