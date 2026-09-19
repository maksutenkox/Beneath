const sharp = require(process.env.SHARP_MODULE || "sharp");
const fs = require("node:fs/promises");
const path = require("node:path");

const assetRoot = path.resolve(__dirname, "../src/game/assets/below-protocol");
const sourceRoot = path.join(assetRoot, "source");

async function removeNeutralBackdrop(source) {
  const { data, info } = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let index = 0; index < data.length; index += 4) {
    const r = data[index], g = data[index + 1], b = data[index + 2];
    const min = Math.min(r, g, b), max = Math.max(r, g, b);
    if (min > 150 && max - min < 13) data[index + 3] = 0;
  }
  return sharp(data, { raw: info }).png().toBuffer();
}

async function fixedCell(clean, box, frame, scale) {
  const crop = await sharp(clean).extract(box).resize({
    width: Math.max(1, Math.round(box.width * scale)),
    height: Math.max(1, Math.round(box.height * scale)),
    fit: "fill",
    kernel: "nearest"
  }).png().toBuffer();
  const metadata = await sharp(crop).metadata();
  return sharp({ create: { width: frame.width, height: frame.height, channels: 4, background: "#00000000" } })
    .composite([{ input: crop, left: Math.round((frame.width - metadata.width) / 2), top: frame.height - metadata.height }])
    .png().toBuffer();
}

async function buildHeroine() {
  const source = path.join(sourceRoot, "heroine-source.png");
  const clean = await removeNeutralBackdrop(source);
  const frame = { width: 96, height: 112 }, bands = [[0, 210], [210, 420], [420, 635], [635, 835], [835, 1024]];
  const parts = [];
  for (let row = 0; row < 5; row += 1) for (let col = 0; col < 8; col += 1) {
    const [top, bottom] = bands[row];
    const box = row === 0
      ? { left: 49 + col * 163, top, width: 163, height: bottom - top }
      : { left: col * 192, top, width: 192, height: bottom - top };
    const tile = await fixedCell(clean, box, frame, .46);
    parts.push({ input: tile, left: col * frame.width, top: row * frame.height });
    await fs.writeFile(path.join(assetRoot, `hero-${row}-${col}.png`), tile);
  }
  await sharp({ create: { width: frame.width * 8, height: frame.height * 5, channels: 4, background: "#00000000" } })
    .composite(parts).png().toFile(path.join(assetRoot, "heroine-side.png"));
}

async function buildZombie() {
  const source = path.join(sourceRoot, "office-zombie-source.png");
  const metadata = await sharp(source).metadata();
  const frame = { width: 96, height: 112 }, parts = [];
  for (let row = 0; row < 4; row += 1) for (let col = 0; col < 8; col += 1) {
    const left = Math.floor(col * metadata.width / 8), right = Math.floor((col + 1) * metadata.width / 8);
    const top = Math.floor(row * metadata.height / 4), bottom = Math.floor((row + 1) * metadata.height / 4);
    const tile = await fixedCell(source, { left, top, width: right - left, height: bottom - top }, frame, .43);
    parts.push({ input: tile, left: col * frame.width, top: row * frame.height });
  }
  await sharp({ create: { width: frame.width * 8, height: frame.height * 4, channels: 4, background: "#00000000" } })
    .composite(parts).png().toFile(path.join(assetRoot, "office-zombie.png"));
}

async function buildBackdrops() {
  const source = path.join(sourceRoot, "office-backdrops-source.png");
  const metadata = await sharp(source).metadata();
  const frame = 256, parts = [];
  for (let row = 0; row < 2; row += 1) for (let col = 0; col < 4; col += 1) {
    const rawLeft = Math.floor(col * metadata.width / 4), rawRight = Math.floor((col + 1) * metadata.width / 4);
    const rawTop = Math.floor(row * metadata.height / 2), rawBottom = Math.floor((row + 1) * metadata.height / 2);
    const inset = 6;
    const tile = await sharp(source).extract({ left: rawLeft + inset, top: rawTop + inset, width: rawRight - rawLeft - inset * 2, height: rawBottom - rawTop - inset * 2 })
      .resize(frame, frame, { fit: "fill", kernel: "nearest" }).png().toBuffer();
    parts.push({ input: tile, left: col * frame, top: row * frame });
  }
  await sharp({ create: { width: frame * 4, height: frame * 2, channels: 4, background: "#000000ff" } })
    .composite(parts).png().toFile(path.join(assetRoot, "office-backdrops.png"));
}

async function main() {
  await Promise.all([buildHeroine(), buildZombie(), buildBackdrops()]);
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
