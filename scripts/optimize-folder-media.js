const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const DIRS = {
  "\u8f6e\u64ad\u56fe\u7247": { max: 1600, thumb: 480 },
  "\u7cbe\u5f69\u77ac\u95f4": { max: 1200, thumb: 480 },
  "\u8363\u8a89\u8bc1\u4e66": { max: 1200, thumb: 480 },
  "\u5b9e\u9a8c\u5ba4LOGO": { max: 256, thumb: 128 },
};

const RASTER = new Set([".jpg", ".jpeg", ".png", ".webp", ".bmp"]);
const SKIP = new Set([".svg", ".gif"]);

async function optimizeOne(filePath, profile) {
  const ext = path.extname(filePath).toLowerCase();
  if (!RASTER.has(ext) || SKIP.has(ext)) return null;
  if (filePath.includes("-thumb.")) return null;
  if (ext === ".webp") return null;

  const dir = path.dirname(filePath);
  const base = path.basename(filePath, ext);
  const outPath = path.join(dir, base + ".webp");
  const thumbPath = path.join(dir, base + "-thumb.webp");

  const buffer = fs.readFileSync(filePath);
  const optimized = await sharp(buffer)
    .rotate()
    .resize({ width: profile.max, height: profile.max, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 2 })
    .toBuffer();
  fs.writeFileSync(outPath, optimized);

  const thumbBuf = await sharp(optimized)
    .resize({ width: profile.thumb, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 75, effort: 2 })
    .toBuffer();
  fs.writeFileSync(thumbPath, thumbBuf);

  return { file: path.basename(filePath), saved: buffer.length - optimized.length };
}

async function processDir(dirName, profile) {
  const locations = [
    path.join(process.cwd(), dirName),
    path.join(process.cwd(), "public", dirName),
  ];
  let count = 0;
  let saved = 0;
  for (const dir of locations) {
    if (!fs.existsSync(dir)) continue;
    const files = fs.readdirSync(dir).filter((f) => {
      const ext = path.extname(f).toLowerCase();
      return RASTER.has(ext) && !f.includes("-thumb.") && ext !== ".webp";
    });
    for (const file of files) {
      const result = await optimizeOne(path.join(dir, file), profile);
      if (result) {
        count++;
        saved += result.saved;
        console.log("[" + dirName + "]", result.file);
      }
    }
  }
  return { count, saved };
}

async function main() {
  let total = 0;
  let totalSaved = 0;
  for (const [dirName, profile] of Object.entries(DIRS)) {
    const { count, saved } = await processDir(dirName, profile);
    total += count;
    totalSaved += saved;
  }
  console.log("Done.", total, "images, saved ~", Math.round(totalSaved / 1024), "KB");
}

main().catch((e) => { console.error(e); process.exit(1); });
