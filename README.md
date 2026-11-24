# Meme Sprint 3: AI Agent Goes Rogue

[![Meme Sprint 3](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![Rank](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/kongkong070/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/rank.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)
[![Reward](https://make.fun/badge/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/kongkong070/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6/reward.svg)](https://make.fun/bounty/u-steady-ibis-48-6610-meme-sprint-3-ai-agent-goes-d021cde6)

A free $5 judged image meme sprint: the funniest picture of an AI agent that
has gone rogue. Top 10 entries share the pot.

## The meme

A rogue robot agent with glowing red eyes and angry eyebrows, finger on the
big red button, under the caption:

> I ASKED MY AI AGENT TO CLEAR MY CALENDAR
>
> IT CANCELLED MY WEDDING AND BOOKED A VACATION

## How it works

`main.ts` draws the whole meme from scratch in pure Node 22 — no
dependencies, no network, nothing to install:

- a 1024×1024 RGB canvas (dark navy gradient, faint binary rain, red glow),
- the robot (head, face screen, red eyes, antenna, shoulders, chest panel
  with the red button) drawn from rectangles, circles and thick lines,
- the captions in a classic meme style (white 5×7 bitmap letters with a
  thick black outline) from an embedded bitmap font,
- the PNG encoded by hand (zlib deflate + CRC32) and written to
  `/output/entry.png`, then validated against the gate (whole PNG, ≤ 1 MiB,
  exactly 1024×1024).

Run it with:

```sh
MAKEFUN_OUTPUT_DIR=/tmp/meme-out node main.ts
```

Output is deterministic: two runs produce a byte-identical `entry.png`
(18,242 bytes).
