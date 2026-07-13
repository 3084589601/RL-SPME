const fs = require("fs");
const path = require("path");

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp)$/i;
const CAROUSEL = "\u8f6e\u64ad\u56fe\u7247";
const LOGO = "\u5b9e\u9a8c\u5ba4LOGO";
const CERT = "\u8363\u8a89\u8bc1\u4e66";
const HIGHLIGHTS = "\u7cbe\u5f69\u77ac\u95f4";

function resolveDir(dirName) {
  const candidates = [
    path.join(process.cwd(), "public", dirName),
    path.join(process.cwd(), dirName),
  ];
  return candidates.find((p) => fs.existsSync(p)) ?? candidates[0];
}

function fileBaseName(file) {
  return file.replace(/\.[^.]+$/i, "");
}

function listImages(dirPath) {
  if (!fs.existsSync(dirPath)) return [];
  const files = fs
    .readdirSync(dirPath)
    .filter((f) => IMAGE_EXT.test(f) && !f.includes("-thumb."));
  const webpBases = new Set(
    files.filter((f) => /\.webp$/i.test(f)).map((f) => fileBaseName(f))
  );
  return files
    .filter((f) => {
      if (/\.webp$/i.test(f)) return true;
      return !webpBases.has(fileBaseName(f));
    })
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function pickLogo(files, variant) {
  if (!files.length) return null;
  const white = /白底|white[-_]?bg|logo[-_]?white|logo[-_]?bg/i;
  const cutout = /抠图|cutout|transparent|logo[-_]?cutout/i;
  const whiteFiles = files.filter((f) => white.test(f));
  const cutoutFiles = files.filter((f) => cutout.test(f) || !white.test(f));
  if (variant === "white") {
    return whiteFiles.find((f) => /^logo/i.test(f)) ?? whiteFiles[0] ?? files[0];
  }
  return (
    cutoutFiles.find((f) => /^logo\.(png|webp|jpg|jpeg)$/i.test(f)) ??
    cutoutFiles.find((f) => cutout.test(f)) ??
    cutoutFiles.find((f) => !white.test(f)) ??
    files[0]
  );
}

function publicUrl(dirName, file) {
  return `/${dirName}/${file.split(/[/\\]/).pop()}`;
}

function folderItems(dirName, idPrefix) {
  const dir = resolveDir(dirName);
  return listImages(dir).map((file, index) => ({
    id: `${idPrefix}-${index}`,
    title: file.replace(/\.[^.]+$/i, ""),
    description: null,
    imageUrl: publicUrl(dirName, file),
    year: null,
  }));
}

const logoFiles = listImages(resolveDir(LOGO));
const manifest = {
  logoCutout: pickLogo(logoFiles, "cutout") ? publicUrl(LOGO, pickLogo(logoFiles, "cutout")) : null,
  logoWhite: pickLogo(logoFiles, "white") ? publicUrl(LOGO, pickLogo(logoFiles, "white")) : null,
  carousel: listImages(resolveDir(CAROUSEL)).map((file, index) => ({
    id: `carousel-${index}`,
    title: "",
    subtitle: null,
    imageUrl: publicUrl(CAROUSEL, file),
    link: null,
  })),
  highlights: folderItems(HIGHLIGHTS, "highlight"),
  certificates: folderItems(CERT, "cert"),
};

const outDir = path.join(process.cwd(), "src", "generated");
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, "media-manifest.json"), JSON.stringify(manifest, null, 2));
console.log("Generated media manifest");