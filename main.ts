// The World Today — Thursday 19 November 2026
// A hand-drawn newspaper front page: one PNG, 1024x1024, standard library only.
// Draws with a hand-made 5x7 bitmap font and a hand-written PNG encoder.
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

// ---------------------------------------------------------------------------
// 5x7 bitmap font. Each glyph is 7 rows of 5 bits, most significant bit left.
// Only the characters the page needs: capitals, digits and common punctuation.
// ---------------------------------------------------------------------------
const FONT: Record<string, number[]> = {
  'A': [0x0E, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
  'B': [0x1E, 0x11, 0x11, 0x1E, 0x11, 0x11, 0x1E],
  'C': [0x0E, 0x11, 0x10, 0x10, 0x10, 0x11, 0x0E],
  'D': [0x1E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x1E],
  'E': [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x1F],
  'F': [0x1F, 0x10, 0x10, 0x1E, 0x10, 0x10, 0x10],
  'G': [0x0E, 0x11, 0x10, 0x17, 0x11, 0x11, 0x0F],
  'H': [0x11, 0x11, 0x11, 0x1F, 0x11, 0x11, 0x11],
  'I': [0x0E, 0x04, 0x04, 0x04, 0x04, 0x04, 0x0E],
  'J': [0x07, 0x02, 0x02, 0x02, 0x02, 0x12, 0x0C],
  'K': [0x11, 0x12, 0x14, 0x18, 0x14, 0x12, 0x11],
  'L': [0x10, 0x10, 0x10, 0x10, 0x10, 0x10, 0x1F],
  'M': [0x11, 0x1B, 0x15, 0x15, 0x11, 0x11, 0x11],
  'N': [0x11, 0x19, 0x15, 0x13, 0x11, 0x11, 0x11],
  'O': [0x0E, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
  'P': [0x1E, 0x11, 0x11, 0x1E, 0x10, 0x10, 0x10],
  'Q': [0x0E, 0x11, 0x11, 0x11, 0x15, 0x12, 0x0D],
  'R': [0x1E, 0x11, 0x11, 0x1E, 0x14, 0x12, 0x11],
  'S': [0x0F, 0x10, 0x10, 0x0E, 0x01, 0x01, 0x1E],
  'T': [0x1F, 0x04, 0x04, 0x04, 0x04, 0x04, 0x04],
  'U': [0x11, 0x11, 0x11, 0x11, 0x11, 0x11, 0x0E],
  'V': [0x11, 0x11, 0x11, 0x11, 0x11, 0x0A, 0x04],
  'W': [0x11, 0x11, 0x11, 0x15, 0x15, 0x1B, 0x11],
  'X': [0x11, 0x11, 0x0A, 0x04, 0x0A, 0x11, 0x11],
  'Y': [0x11, 0x11, 0x0A, 0x04, 0x04, 0x04, 0x04],
  'Z': [0x1F, 0x01, 0x02, 0x04, 0x08, 0x10, 0x1F],
  '0': [0x0E, 0x11, 0x13, 0x15, 0x19, 0x11, 0x0E],
  '1': [0x04, 0x0C, 0x04, 0x04, 0x04, 0x04, 0x0E],
  '2': [0x0E, 0x11, 0x01, 0x02, 0x04, 0x08, 0x1F],
  '3': [0x1F, 0x02, 0x04, 0x02, 0x01, 0x11, 0x0E],
  '4': [0x02, 0x06, 0x0A, 0x12, 0x1F, 0x02, 0x02],
  '5': [0x1F, 0x10, 0x1E, 0x01, 0x01, 0x11, 0x0E],
  '6': [0x06, 0x08, 0x10, 0x1E, 0x11, 0x11, 0x0E],
  '7': [0x1F, 0x01, 0x02, 0x04, 0x08, 0x08, 0x08],
  '8': [0x0E, 0x11, 0x11, 0x0E, 0x11, 0x11, 0x0E],
  '9': [0x0E, 0x11, 0x11, 0x0F, 0x01, 0x02, 0x0C],
  ' ': [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00],
  '.': [0x00, 0x00, 0x00, 0x00, 0x00, 0x0C, 0x0C],
  ',': [0x00, 0x00, 0x00, 0x00, 0x0C, 0x04, 0x08],
  "'": [0x04, 0x04, 0x08, 0x00, 0x00, 0x00, 0x00],
  '-': [0x00, 0x00, 0x00, 0x0E, 0x00, 0x00, 0x00],
  '!': [0x04, 0x04, 0x04, 0x04, 0x04, 0x00, 0x04],
  '?': [0x0E, 0x11, 0x01, 0x02, 0x04, 0x00, 0x04],
  '/': [0x01, 0x01, 0x02, 0x04, 0x08, 0x10, 0x10],
  '(': [0x02, 0x04, 0x08, 0x08, 0x08, 0x04, 0x02],
  ')': [0x08, 0x04, 0x02, 0x02, 0x02, 0x04, 0x08],
  '%': [0x19, 0x19, 0x02, 0x04, 0x08, 0x13, 0x13],
  '$': [0x04, 0x0F, 0x14, 0x0E, 0x05, 0x1E, 0x04],
  '&': [0x0C, 0x12, 0x14, 0x08, 0x15, 0x12, 0x0D],
  '+': [0x00, 0x04, 0x04, 0x1F, 0x04, 0x04, 0x00],
  '=': [0x00, 0x00, 0x1F, 0x00, 0x1F, 0x00, 0x00],
  '"': [0x0A, 0x0A, 0x0A, 0x00, 0x00, 0x00, 0x00],
  ';': [0x00, 0x0C, 0x0C, 0x00, 0x0C, 0x04, 0x08],
  ':': [0x00, 0x0C, 0x0C, 0x00, 0x0C, 0x0C, 0x00],
};

// ---------------------------------------------------------------------------
// Canvas: an RGB buffer with tiny drawing primitives.
// ---------------------------------------------------------------------------
const W = 1024;
const H = 1024;
const PAPER: [number, number, number] = [246, 241, 229];
const INK: [number, number, number] = [26, 26, 26];
const RED: [number, number, number] = [163, 22, 33];
const BLUE: [number, number, number] = [31, 78, 121];
const GREY: [number, number, number] = [120, 112, 96];

const px = new Uint8Array(W * H * 3);
for (let i = 0; i < W * H; i++) {
  px[i * 3] = PAPER[0]; px[i * 3 + 1] = PAPER[1]; px[i * 3 + 2] = PAPER[2];
}

function setPixel(x: number, y: number, c: [number, number, number]): void {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const o = (y * W + x) * 3;
  px[o] = c[0]; px[o + 1] = c[1]; px[o + 2] = c[2];
}

function fillRect(x: number, y: number, w: number, h: number, c: [number, number, number]): void {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) setPixel(i, j, c);
}

function hline(x0: number, x1: number, y: number, c: [number, number, number], t = 1): void {
  for (let t0 = 0; t0 < t; t0++) for (let x = x0; x <= x1; x++) setPixel(x, y + t0, c);
}

function vline(x: number, y0: number, y1: number, c: [number, number, number], t = 1): void {
  for (let t0 = 0; t0 < t; t0++) for (let y = y0; y <= y1; y++) setPixel(x + t0, y, c);
}

// Bresenham line.
function line(x0: number, y0: number, x1: number, y1: number, c: [number, number, number], t = 1): void {
  const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
  let err = dx + dy, x = x0, y = y0;
  for (;;) {
    fillRect(x - Math.floor(t / 2), y - Math.floor(t / 2), t, t, c);
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x += sx; }
    if (e2 <= dx) { err += dx; y += sy; }
  }
}

function circle(cx: number, cy: number, r: number, c: [number, number, number], t = 1): void {
  let x = r, y = 0, err = 0;
  while (x >= y) {
    const pts: [number, number][] = [
      [cx + x, cy + y], [cx + y, cy + x], [cx - y, cy + x], [cx - x, cy + y],
      [cx - x, cy - y], [cx - y, cy - x], [cx + y, cy - x], [cx + x, cy - y],
    ];
    for (const [pxx, pyy] of pts) fillRect(pxx - Math.floor(t / 2), pyy - Math.floor(t / 2), t, t, c);
    y += 1;
    if (err <= 0) { err += 2 * y + 1; }
    if (err > 0) { x -= 1; err -= 2 * x + 1; }
  }
}

function fillCircle(cx: number, cy: number, r: number, c: [number, number, number]): void {
  for (let y = -r; y <= r; y++) {
    const half = Math.floor(Math.sqrt(r * r - y * y));
    for (let x = -half; x <= half; x++) setPixel(cx + x, cy + y, c);
  }
}

// ---------------------------------------------------------------------------
// Text. scale s: each font pixel is s x s, glyph advance is 6*s.
// ---------------------------------------------------------------------------
function textWidth(s: string, scale: number): number {
  return s.length * 6 * scale - scale;
}

function drawChar(ch: string, x: number, y: number, scale: number, c: [number, number, number]): void {
  const g = FONT[ch] ?? FONT['?'];
  for (let r = 0; r < 7; r++) {
    for (let col = 0; col < 5; col++) {
      if (g[r] & (1 << (4 - col))) fillRect(x + col * scale, y + r * scale, scale, scale, c);
    }
  }
}

function drawText(s: string, x: number, y: number, scale: number, c: [number, number, number]): void {
  for (let i = 0; i < s.length; i++) drawChar(s[i], x + i * 6 * scale, y, scale, c);
}

function drawTextCentered(s: string, cx: number, y: number, scale: number, c: [number, number, number]): void {
  drawText(s, cx - Math.floor(textWidth(s, scale) / 2), y, scale, c);
}

function wrapText(s: string, maxChars: number): string[] {
  const words = s.split(' ');
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    if (cur === '') { cur = w; continue; }
    if (cur.length + 1 + w.length <= maxChars) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur !== '') lines.push(cur);
  return lines;
}

function drawParagraph(s: string, x: number, y: number, maxWidth: number, scale: number, c: [number, number, number], lineGap = 4): string[] {
  const maxChars = Math.max(1, Math.floor(maxWidth / (6 * scale)));
  const lines = wrapText(s, maxChars);
  lines.forEach((ln, i) => drawText(ln, x, y + i * (7 * scale + lineGap), scale, c));
  return lines;
}

// ---------------------------------------------------------------------------
// Pictograms — small line drawings, one per story.
// ---------------------------------------------------------------------------
function picGlobe(x: number, y: number, s: number): void {
  // A world globe with three stars above it: the three-way summit.
  const cx = x + Math.floor(s / 2), cy = y + Math.floor(s / 2) + 10;
  const r = Math.floor(s / 2) - 14;
  circle(cx, cy, r, INK, 4);
  // Meridians and parallels.
  vline(cx, cy - r, cy + r, INK, 2);
  hline(cx - r, cx + r, cy, INK, 2);
  for (const dy of [-Math.floor(r / 2), Math.floor(r / 2)]) {
    const half = Math.floor(Math.sqrt(Math.max(0, r * r - dy * dy)) * 0.82);
    hline(cx - half, cx + half, cy + dy, INK, 2);
  }
  // Three stars: the three leaders.
  for (const [sx, sy] of [[x + 8, y + 2], [x + Math.floor(s / 2) - 6, y - 6], [x + s - 20, y + 2]]) {
    fillRect(sx + 4, sy, 4, 12, RED);
    fillRect(sx, sy + 4, 12, 4, RED);
  }
}

function picScales(x: number, y: number, s: number): void {
  // The scales of justice: the world court.
  const cx = x + Math.floor(s / 2);
  vline(cx, y + 8, y + s - 14, INK, 4);
  hline(cx - 34, cx + 34, y + 14, INK, 4);
  fillCircle(cx, y + 10, 5, INK);
  for (const side of [-1, 1]) {
    const px0 = cx + side * 34;
    line(px0, y + 14, px0 - 12, y + 44, INK, 3);
    line(px0, y + 14, px0 + 12, y + 44, INK, 3);
    line(px0 - 12, y + 44, px0 + 12, y + 44, INK, 3);
    fillRect(px0 - 14, y + 44, 28, 4, INK);
  }
  hline(cx - 26, cx + 26, y + s - 10, INK, 4);
}

function picBridge(x: number, y: number, s: number): void {
  // A bridge struck from above: the Crimean bridge.
  const cx = x + Math.floor(s / 2);
  hline(x + 6, x + s - 6, y + s - 30, INK, 4);
  // Arch.
  for (let i = 0; i <= 40; i++) {
    const t = (i / 40) * Math.PI;
    const bx = Math.floor(cx - 36 + (72 * i) / 40);
    const by = Math.floor(y + s - 30 - Math.sin(t) * 34);
    fillRect(bx, by, 3, 3, INK);
  }
  // Supports.
  vline(cx - 30, y + s - 62, y + s - 30, INK, 3);
  vline(cx + 30, y + s - 62, y + s - 30, INK, 3);
  vline(cx, y + s - 64, y + s - 30, INK, 3);
  // A break in the deck and a burst above it.
  fillRect(cx - 6, y + s - 34, 12, 8, PAPER);
  for (let a = 0; a < 8; a++) {
    const ang = (a / 8) * Math.PI * 2;
    line(cx, y + 16, Math.floor(cx + Math.cos(ang) * 18), Math.floor(y + 16 + Math.sin(ang) * 18), RED, 3);
  }
  fillCircle(cx, y + 16, 5, RED);
}

function picStrike(x: number, y: number, s: number): void {
  // A burst over waves: strikes across the Gulf.
  const cx = x + Math.floor(s / 2), cy = y + 34;
  for (let a = 0; a < 10; a++) {
    const ang = (a / 10) * Math.PI * 2;
    const len = a % 2 === 0 ? 26 : 14;
    line(cx, cy, Math.floor(cx + Math.cos(ang) * len), Math.floor(cy + Math.sin(ang) * len), RED, 4);
  }
  fillCircle(cx, cy, 8, RED);
  // Waves below.
  for (const wy of [y + s - 34, y + s - 22]) {
    for (let i = 0; i < 5; i++) {
      const wx = x + 8 + i * 18;
      line(wx, wy, wx + 8, wy - 6, BLUE, 3);
      line(wx + 8, wy - 6, wx + 16, wy, BLUE, 3);
    }
  }
}

function picAid(x: number, y: number, s: number): void {
  // A cross in a circle: aid for Gaza.
  const cx = x + Math.floor(s / 2), cy = y + Math.floor(s / 2);
  circle(cx, cy, 36, INK, 4);
  fillRect(cx - 8, cy - 24, 16, 48, RED);
  fillRect(cx - 24, cy - 8, 48, 16, RED);
}

function picChart(x: number, y: number, s: number): void {
  // Rising bars: a record market debut.
  const base = y + s - 16;
  hline(x + 8, x + s - 8, base, INK, 4);
  vline(x + 8, y + 12, base, INK, 4);
  const heights = [18, 30, 26, 44, 58];
  heights.forEach((hh, i) => {
    fillRect(x + 18 + i * 15, base - hh, 10, hh, i === heights.length - 1 ? RED : BLUE);
  });
  // A rising arrow over the bars.
  line(x + 16, base - 46, x + s - 14, y + 10, RED, 4);
  line(x + s - 14, y + 10, x + s - 26, y + 10, RED, 4);
  line(x + s - 14, y + 10, x + s - 14, y + 22, RED, 4);
}

function picFlame(x: number, y: number, s: number): void {
  // A house with a flame above it: unrest in Bangladesh.
  const cx = x + Math.floor(s / 2);
  const hy = y + s - 44;
  // Flame.
  fillRect(cx - 4, y + 8, 8, 22, RED);
  line(cx - 10, y + 30, cx, y + 8, RED, 4);
  line(cx + 10, y + 30, cx, y + 8, RED, 4);
  fillRect(cx - 12, y + 28, 24, 6, RED);
  // House.
  line(x + 12, hy, cx, hy - 20, INK, 4);
  line(cx, hy - 20, x + s - 12, hy, INK, 4);
  vline(x + 12, hy, y + s - 8, INK, 4);
  vline(x + s - 12, hy, y + s - 8, INK, 4);
  hline(x + 12, x + s - 12, y + s - 8, INK, 4);
  fillRect(cx - 7, y + s - 26, 14, 18, INK);
}

// ---------------------------------------------------------------------------
// The front page.
// ---------------------------------------------------------------------------
const M = 36;                 // outer margin
const CW = W - 2 * M;         // content width

// Masthead.
drawTextCentered('THE WORLD TODAY', W / 2, 30, 8, INK);
hline(M, W - M, 108, INK, 3);
hline(M, W - M, 114, RED, 3);
drawTextCentered('THURSDAY 19 NOVEMBER 2026', W / 2, 128, 3, INK);
drawTextCentered('ONE DAY IN ONE IMAGE', W / 2, 156, 2, GREY);
hline(M, W - M, 184, INK, 2);

// Lead story.
const leadY = 204;
drawText('LEAD STORY', M, leadY, 2, RED);
drawParagraph('FIRST THREE-WAY SUMMIT OF TRUMP, XI AND PUTIN', M, leadY + 30, 620, 4, INK, 6);
drawParagraph(
  'THE US, CHINESE AND RUSSIAN LEADERS MEET IN SHENZHEN ON THE SIDELINES OF THE APEC SUMMIT, AND AGREE TO KEEP TALKING ON NUCLEAR RISKS.',
  M, leadY + 116, 620, 2, INK, 5,
);
picGlobe(W - M - 210, leadY + 6, 210);
hline(M, W - M, 428, INK, 2);

// Six more stories, two columns by three rows.
type Story = { kicker: string; head: string; deck: string; pic: (x: number, y: number, s: number) => void };
const stories: Story[] = [
  {
    kicker: 'THE HAGUE',
    head: 'MYANMAR GUILTY OF GENOCIDE',
    deck: 'UN COURT RULES ON THE 2017 CRACKDOWN ON THE ROHINGYA',
    pic: picScales,
  },
  {
    kicker: 'KYIV',
    head: 'UKRAINE HITS CRIMEA BRIDGE',
    deck: 'THIRD HIT THIS WEEK; FIVE KILLED IN RUSSIAN STRIKES',
    pic: picBridge,
  },
  {
    kicker: 'THE GULF',
    head: 'US STRIKES IRAN; GULF HIT BACK',
    deck: 'QESHM ISLAND STRUCK; IRAN RETALIATES ON KUWAIT, BAHRAIN',
    pic: picStrike,
  },
  {
    kicker: 'GAZA',
    head: 'ISRAEL PUSHES INTO CENTRAL GAZA',
    deck: 'TANKS CROSS THE CEASEFIRE LINE AS ALLIES URGE AID ACCESS',
    pic: picAid,
  },
  {
    kicker: 'MARKETS',
    head: 'ANTHROPIC RAISES RECORD $81BN',
    deck: "AI FIRM'S MARKET DEBUT AT $83 A SHARE, THE BIGGEST YET",
    pic: picChart,
  },
  {
    kicker: 'DHAKA',
    head: 'BANGLADESH UNREST: FOUR KILLED',
    deck: 'YUNUS FAMILY HOME SET ABLAZE AMID NATIONWIDE SHUTDOWN',
    pic: picFlame,
  },
];

const gridY = 448;
const cellW = Math.floor(CW / 2);
const cellH = 158;
stories.forEach((st, i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x0 = M + col * cellW;
  const y0 = gridY + row * cellH;
  if (col === 1) vline(x0 - 8, y0 + 6, y0 + cellH - 14, GREY, 1);
  if (row > 0) hline(x0, x0 + cellW - (col === 0 ? 16 : 0), y0 - 8, GREY, 1);
  st.pic(x0 + 6, y0 + 8, 112);
  const tx = x0 + 132;
  drawText(st.kicker, tx, y0 + 10, 2, RED);
  const headLines = drawParagraph(st.head, tx, y0 + 34, cellW - 150, 3, INK, 4);
  const deckY = y0 + 34 + headLines.length * (7 * 3 + 4) + 8;
  drawParagraph(st.deck, tx, deckY, cellW - 150, 2, INK, 4);
});

// Footer.
hline(M, W - M, 936, INK, 2);
drawTextCentered('ALL EVENTS REPORTED ON THURSDAY 19 NOVEMBER 2026', W / 2, 952, 2, INK);
drawTextCentered('THE WORLD TODAY', W / 2, 978, 1, GREY);

// ---------------------------------------------------------------------------
// PNG encoder: 8-bit RGB, filter 0, zlib level 9. Deterministic.
// ---------------------------------------------------------------------------
function crc32(buf: Buffer): number {
  let table = (crc32 as unknown as { t?: Int32Array }).t;
  if (!table) {
    table = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[n] = c;
    }
    (crc32 as unknown as { t: Int32Array }).t = table;
  }
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer): Buffer {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}

function encodePNG(): Buffer {
  const raw = Buffer.alloc(H * (1 + W * 3));
  for (let y = 0; y < H; y++) {
    raw[y * (1 + W * 3)] = 0;
    raw.set(px.subarray(y * W * 3, (y + 1) * W * 3), y * (1 + W * 3) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(W, 0);
  ihdr.writeUInt32BE(H, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: RGB
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, 'entry.png'), encodePNG());
