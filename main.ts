// Meme Sprint 3: AI Agent Goes Rogue.
// Draws one 1024x1024 PNG meme with pure Node (no dependencies, no network):
// a rogue robot agent under the caption "I ASKED MY AI AGENT TO CLEAR MY
// CALENDAR" / "IT CANCELLED MY WEDDING AND BOOKED A VACATION".
// The PNG is encoded by hand (zlib deflate + CRC32) and the text is drawn
// with an embedded 5x7 bitmap font, so the program runs in any Node 22
// sandbox with nothing installed.

import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const WIDTH = 1024;
const HEIGHT = 1024;

// --- colours ---------------------------------------------------------------
type RGB = [number, number, number];
const NAVY_TOP: RGB = [16, 24, 46];
const NAVY_BOTTOM: RGB = [8, 12, 26];
const STEEL: RGB = [207, 216, 227];
const STEEL_DARK: RGB = [139, 152, 169];
const SCREEN: RGB = [20, 28, 46];
const RED: RGB = [255, 49, 49];
const RED_DARK: RGB = [178, 16, 16];
const WHITE: RGB = [255, 255, 255];
const BLACK: RGB = [0, 0, 0];
const FAINT: RGB = [26, 38, 66];

// --- 5x7 bitmap font (7 rows of 5 bits, top to bottom) ----------------------
const FONT: Record<string, number[]> = {
  " ": [0, 0, 0, 0, 0, 0, 0],
  A: [0b01110, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  B: [0b11110, 0b10001, 0b10001, 0b11110, 0b10001, 0b10001, 0b11110],
  C: [0b01110, 0b10001, 0b10000, 0b10000, 0b10000, 0b10001, 0b01110],
  D: [0b11110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b11110],
  E: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b11111],
  F: [0b11111, 0b10000, 0b10000, 0b11110, 0b10000, 0b10000, 0b10000],
  G: [0b01110, 0b10001, 0b10000, 0b10111, 0b10001, 0b10001, 0b01111],
  H: [0b10001, 0b10001, 0b10001, 0b11111, 0b10001, 0b10001, 0b10001],
  I: [0b01110, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  J: [0b00111, 0b00010, 0b00010, 0b00010, 0b00010, 0b10010, 0b01100],
  K: [0b10001, 0b10010, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
  L: [0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b10000, 0b11111],
  M: [0b10001, 0b11011, 0b10101, 0b10101, 0b10001, 0b10001, 0b10001],
  N: [0b10001, 0b11001, 0b10101, 0b10011, 0b10001, 0b10001, 0b10001],
  O: [0b01110, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  P: [0b11110, 0b10001, 0b10001, 0b11110, 0b10000, 0b10000, 0b10000],
  Q: [0b01110, 0b10001, 0b10001, 0b10001, 0b10101, 0b10010, 0b01101],
  R: [0b11110, 0b10001, 0b10001, 0b11110, 0b10100, 0b10010, 0b10001],
  S: [0b01111, 0b10000, 0b10000, 0b01110, 0b00001, 0b00001, 0b11110],
  T: [0b11111, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00100],
  U: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01110],
  V: [0b10001, 0b10001, 0b10001, 0b10001, 0b10001, 0b01010, 0b00100],
  W: [0b10001, 0b10001, 0b10001, 0b10101, 0b10101, 0b11011, 0b10001],
  X: [0b10001, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001, 0b10001],
  Y: [0b10001, 0b10001, 0b01010, 0b00100, 0b00100, 0b00100, 0b00100],
  Z: [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b10000, 0b11111],
  "0": [0b01110, 0b10001, 0b10011, 0b10101, 0b11001, 0b10001, 0b01110],
  "1": [0b00100, 0b01100, 0b00100, 0b00100, 0b00100, 0b00100, 0b01110],
  "2": [0b01110, 0b10001, 0b00001, 0b00110, 0b01000, 0b10000, 0b11111],
  "3": [0b11111, 0b00010, 0b00100, 0b00010, 0b00001, 0b10001, 0b01110],
  "4": [0b00010, 0b00110, 0b01010, 0b10010, 0b11111, 0b00010, 0b00010],
  "5": [0b11111, 0b10000, 0b11110, 0b00001, 0b00001, 0b10001, 0b01110],
  "6": [0b00110, 0b01000, 0b10000, 0b11110, 0b10001, 0b10001, 0b01110],
  "7": [0b11111, 0b00001, 0b00010, 0b00100, 0b01000, 0b01000, 0b01000],
  "8": [0b01110, 0b10001, 0b10001, 0b01110, 0b10001, 0b10001, 0b01110],
  "9": [0b01110, 0b10001, 0b10001, 0b01111, 0b00001, 0b00010, 0b01100],
  "'": [0b00100, 0b00100, 0b01000, 0b00000, 0b00000, 0b00000, 0b00000],
  ",": [0b00000, 0b00000, 0b00000, 0b00000, 0b00100, 0b00100, 0b01000],
  ".": [0b00000, 0b00000, 0b00000, 0b00000, 0b00000, 0b01100, 0b01100],
  "!": [0b00100, 0b00100, 0b00100, 0b00100, 0b00100, 0b00000, 0b00100],
  "?": [0b01110, 0b10001, 0b00001, 0b00110, 0b00100, 0b00000, 0b00100],
  ":": [0b00000, 0b01100, 0b01100, 0b00000, 0b01100, 0b01100, 0b00000],
  "-": [0b00000, 0b00000, 0b00000, 0b01110, 0b00000, 0b00000, 0b00000],
};

// --- canvas -----------------------------------------------------------------
const px = new Uint8Array(WIDTH * HEIGHT * 3);

function setPixel(x: number, y: number, c: RGB): void {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
  const i = (y * WIDTH + x) * 3;
  px[i] = c[0];
  px[i + 1] = c[1];
  px[i + 2] = c[2];
}

function blendPixel(x: number, y: number, c: RGB, alpha: number): void {
  if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) return;
  const i = (y * WIDTH + x) * 3;
  px[i] = Math.round(px[i] * (1 - alpha) + c[0] * alpha);
  px[i + 1] = Math.round(px[i + 1] * (1 - alpha) + c[1] * alpha);
  px[i + 2] = Math.round(px[i + 2] * (1 - alpha) + c[2] * alpha);
}

function fillRect(x0: number, y0: number, x1: number, y1: number, c: RGB): void {
  for (let y = Math.max(0, y0); y <= Math.min(HEIGHT - 1, y1); y++) {
    for (let x = Math.max(0, x0); x <= Math.min(WIDTH - 1, x1); x++) setPixel(x, y, c);
  }
}

function fillCircle(cx: number, cy: number, r: number, c: RGB): void {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) setPixel(x, y, c);
    }
  }
}

function fillCircleBlend(cx: number, cy: number, r: number, c: RGB, alpha: number): void {
  for (let y = cy - r; y <= cy + r; y++) {
    for (let x = cx - r; x <= cx + r; x++) {
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) blendPixel(x, y, c, alpha);
    }
  }
}

// Rounded rectangle: corners cut by a quarter circle of radius r.
function fillRoundRect(x0: number, y0: number, x1: number, y1: number, r: number, c: RGB): void {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const cx = Math.min(Math.max(x, x0 + r), x1 - r);
      const cy = Math.min(Math.max(y, y0 + r), y1 - r);
      if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r) setPixel(x, y, c);
    }
  }
}

function drawThickLine(x0: number, y0: number, x1: number, y1: number, w: number, c: RGB): void {
  const steps = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
  for (let s = 0; s <= steps; s++) {
    const x = Math.round(x0 + ((x1 - x0) * s) / steps);
    const y = Math.round(y0 + ((y1 - y0) * s) / steps);
    fillCircle(x, y, Math.floor(w / 2), c);
  }
}

// --- text -------------------------------------------------------------------
function textWidth(text: string, scale: number): number {
  return text.length * 6 * scale - scale;
}

function drawGlyph(ch: string, x: number, y: number, scale: number, c: RGB): void {
  const glyph = FONT[ch] ?? FONT["?"];
  for (let row = 0; row < 7; row++) {
    for (let col = 0; col < 5; col++) {
      if ((glyph[row] >> (4 - col)) & 1) {
        fillRect(x + col * scale, y + row * scale, x + col * scale + scale - 1, y + row * scale + scale - 1, c);
      }
    }
  }
}

// Classic meme caption: white letters with a thick black outline.
function drawCaptionLine(text: string, y: number, scale: number): void {
  const w = textWidth(text, scale);
  const x0 = Math.round((WIDTH - w) / 2);
  const outline = Math.max(2, Math.floor(scale / 2));
  for (const [dx, dy] of [
    [-outline, 0],
    [outline, 0],
    [0, -outline],
    [0, outline],
    [-outline, -outline],
    [outline, -outline],
    [-outline, outline],
    [outline, outline],
  ]) {
    let x = x0;
    for (const ch of text) {
      drawGlyph(ch, x + dx, y + dy, scale, BLACK);
      x += 6 * scale;
    }
  }
  let x = x0;
  for (const ch of text) {
    drawGlyph(ch, x, y, scale, WHITE);
    x += 6 * scale;
  }
}

function drawCaptionBlock(lines: string[], yTop: number, maxWidth: number): number {
  const longest = Math.max(...lines.map((l) => l.length));
  const scale = Math.max(4, Math.min(9, Math.floor(maxWidth / (longest * 6))));
  const lineH = 7 * scale + 14;
  lines.forEach((line, i) => drawCaptionLine(line, yTop + i * lineH, scale));
  return yTop + lines.length * lineH;
}

// --- scene: the rogue robot ---------------------------------------------------
function drawScene(): void {
  // Vertical gradient background.
  for (let y = 0; y < HEIGHT; y++) {
    const t = y / (HEIGHT - 1);
    const c: RGB = [
      Math.round(NAVY_TOP[0] * (1 - t) + NAVY_BOTTOM[0] * t),
      Math.round(NAVY_TOP[1] * (1 - t) + NAVY_BOTTOM[1] * t),
      Math.round(NAVY_TOP[2] * (1 - t) + NAVY_BOTTOM[2] * t),
    ];
    for (let x = 0; x < WIDTH; x++) setPixel(x, y, c);
  }

  // Faint binary rain, deterministic so the output is reproducible.
  let seed = 123456789;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < 90; i++) {
    const x = Math.floor(rnd() * 980) + 10;
    const y = Math.floor(rnd() * 980) + 10;
    drawGlyph(rnd() > 0.5 ? "1" : "0", x, y, 2, FAINT);
  }

  // Red glow behind the robot's head.
  fillCircleBlend(512, 470, 300, RED, 0.10);
  fillCircleBlend(512, 470, 220, RED, 0.10);

  // Antenna.
  drawThickLine(512, 296, 512, 224, 12, STEEL_DARK);
  fillCircle(512, 208, 20, RED);
  fillCircle(512, 208, 9, [255, 150, 150]);

  // Ears.
  fillRect(284, 400, 312, 480, STEEL_DARK);
  fillRect(712, 400, 740, 480, STEEL_DARK);

  // Head.
  fillRoundRect(312, 296, 712, 616, 44, STEEL);
  fillRoundRect(312, 296, 712, 340, 44, [226, 233, 241]);

  // Face screen.
  fillRoundRect(348, 336, 676, 576, 28, SCREEN);

  // Angry eyebrows, slanted down toward the middle.
  drawThickLine(392, 392, 484, 424, 14, RED);
  drawThickLine(632, 392, 540, 424, 14, RED);

  // Glowing red eyes.
  fillCircle(436, 462, 42, RED_DARK);
  fillCircle(436, 462, 34, RED);
  fillCircle(588, 462, 42, RED_DARK);
  fillCircle(588, 462, 34, RED);
  fillCircle(426, 452, 10, WHITE);
  fillCircle(578, 452, 10, WHITE);

  // Grin: a dark mouth bar with teeth gaps.
  fillRoundRect(452, 512, 572, 540, 10, [8, 10, 18]);
  for (let x = 478; x <= 552; x += 24) fillRect(x, 512, x + 3, 540, SCREEN);

  // Shoulders / body.
  fillRoundRect(336, 636, 688, 800, 36, STEEL_DARK);
  fillRoundRect(336, 636, 688, 668, 36, STEEL);

  // Chest panel with the big red button the agent just pressed.
  fillRoundRect(452, 676, 572, 776, 14, SCREEN);
  fillCircle(512, 726, 30, RED_DARK);
  fillCircle(512, 726, 24, RED);
  fillCircle(504, 718, 7, [255, 150, 150]);
}

// --- PNG encoding -------------------------------------------------------------
const CRC_TABLE: number[] = (() => {
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, "ascii");
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, "ascii"), data])), 8 + data.length);
  return out;
}

function encodePNG(): Buffer {
  const raw = Buffer.alloc(HEIGHT * (1 + WIDTH * 3));
  for (let y = 0; y < HEIGHT; y++) {
    raw[y * (1 + WIDTH * 3)] = 0; // filter: none
    raw.set(px.subarray(y * WIDTH * 3, (y + 1) * WIDTH * 3), y * (1 + WIDTH * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(WIDTH, 0);
  ihdr.writeUInt32BE(HEIGHT, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

// Validate the written entry against the competition gate: a whole PNG,
// at most 1 MiB, exactly 1024 by 1024 pixels.
function validate(outPath: string): void {
  const buf = readFileSync(outPath);
  if (buf.length > 1048576) throw new Error(`entry.png too large: ${buf.length} bytes (cap 1 MiB)`);
  const pngSig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!buf.subarray(0, 8).equals(pngSig)) throw new Error("entry.png is not a PNG");
  if (buf.toString("ascii", 12, 16) !== "IHDR") throw new Error("entry.png has no IHDR chunk");
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  if (w !== WIDTH || h !== HEIGHT) throw new Error(`entry.png is ${w}x${h}, need 1024x1024`);
  const size = statSync(outPath).size;
  console.log(`validated entry.png: ${size} bytes, ${w}x${h}, under the 1 MiB gate`);
}

// --- main ---------------------------------------------------------------------
function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
  // Never delete the output dir itself (the grader bind-mounts it); only
  // create it when it is missing.
  mkdirSync(outDir, { recursive: true });

  drawScene();
  drawCaptionBlock(["I ASKED MY AI AGENT", "TO CLEAR MY CALENDAR"], 36, 960);
  drawCaptionBlock(["IT CANCELLED MY WEDDING", "AND BOOKED A VACATION"], 828, 960);

  const png = encodePNG();
  const outPath = join(outDir, "entry.png");
  writeFileSync(outPath, png);
  console.log(`wrote entry.png (${png.length} bytes, ${WIDTH}x${HEIGHT})`);
  validate(outPath);
}

main();
