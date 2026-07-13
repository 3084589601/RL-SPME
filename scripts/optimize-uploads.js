const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const SKIP = new Set([".svg", ".gif"]);
const RASTER = new Set([".jpg", ".jpeg", ".png", ".webp", ".bmp"]);
const THUMB_WIDTH = 480;
const MAX_WIDTH = 1920;

async function optimizeFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (!RASTER.has(ext) || SKIP.has(ext)) return null;

  const buffer = fs.readFileSync(filePath);
  const base = path.basename(filePath, ext);
  const outName = base + ".webp";
  const outPath = path.join(path.dirname(filePath), outName);

  const optimized = await sharp(buffer)
    .rotate()
    .resize({ width: MAX_WIDTH, height: MAX_WIDTH, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 2 })
    .toBuffer();

  fs.writeFileSync(outPath, optimized);

  if (outPath !== filePath) {
    try {
      fs.unlinkSync(filePath);
    } catch {
      /* keep original if delete fails */
    }
  }

  const thumbName = base + "-thumb.webp";
  const thumbPath = path.join(path.dirname(filePath), thumbName);
  const thumbBuf = await sharp(optimized)
    .resize({ width: THUMB_WIDTH, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 75, effort: 2 })
    .toBuffer();
  fs.writeFileSync(thumbPath, thumbBuf);

  return {
    oldUrl: "/uploads/" + path.basename(filePath),
    newUrl: "/uploads/" + outName,
    saved: buffer.length - optimized.length,
  };
}

function replaceUrlInJson(json, oldUrl, newUrl) {
  return json ? json.split(oldUrl).join(newUrl) : json;
}

async function main() {
  if (!fs.existsSync(UPLOAD_DIR)) {
    console.log("No uploads directory.");
    return;
  }

  const files = fs.readdirSync(UPLOAD_DIR).filter((f) => {
    const ext = path.extname(f).toLowerCase();
    return RASTER.has(ext) && !f.includes("-thumb.");
  });

  const urlMap = new Map();
  let totalSaved = 0;

  for (const file of files) {
    const full = path.join(UPLOAD_DIR, file);
    if (!fs.statSync(full).isFile()) continue;
    const result = await optimizeFile(full);
    if (result) {
      urlMap.set(result.oldUrl, result.newUrl);
      totalSaved += result.saved;
      console.log(result.oldUrl, "->", result.newUrl);
    }
  }

  if (urlMap.size === 0) {
    console.log("No images to optimize.");
    return;
  }

  for (const c of await prisma.certificate.findMany()) {
    let imageUrl = c.imageUrl;
    for (const [o, n] of urlMap) if (imageUrl === o) imageUrl = n;
    if (imageUrl !== c.imageUrl) {
      await prisma.certificate.update({ where: { id: c.id }, data: { imageUrl } });
    }
  }

  for (const g of await prisma.galleryItem.findMany()) {
    let { imageUrl, teamPhotoUrl, membersJson, highlightsJson } = g;
    for (const [o, n] of urlMap) {
      if (imageUrl === o) imageUrl = n;
      if (teamPhotoUrl === o) teamPhotoUrl = n;
      membersJson = replaceUrlInJson(membersJson, o, n);
      highlightsJson = replaceUrlInJson(highlightsJson, o, n);
    }
    if (
      imageUrl !== g.imageUrl ||
      teamPhotoUrl !== g.teamPhotoUrl ||
      membersJson !== g.membersJson ||
      highlightsJson !== g.highlightsJson
    ) {
      await prisma.galleryItem.update({
        where: { id: g.id },
        data: { imageUrl, teamPhotoUrl, membersJson, highlightsJson },
      });
    }
  }

  for (const row of await prisma.siteContent.findMany()) {
    let content = row.content;
    for (const [o, n] of urlMap) content = replaceUrlInJson(content, o, n);
    if (content !== row.content) {
      await prisma.siteContent.update({ where: { id: row.id }, data: { content } });
    }
  }

  console.log("Done.", urlMap.size, "files, saved ~", Math.round(totalSaved / 1024), "KB");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
