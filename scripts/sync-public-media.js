const fs = require("fs");
const path = require("path");
const MEDIA_DIRS = ["\u8f6e\u64ad\u56fe\u7247", "\u5b9e\u9a8c\u5ba4LOGO", "\u8363\u8a89\u8bc1\u4e66", "\u7cbe\u5f69\u77ac\u95f4"];
function getLinkTarget(target) { try { return fs.readlinkSync(target); } catch { return null; } }
function isExternalLink(target) { const linkTarget = getLinkTarget(target); if (!linkTarget) return false; return path.isAbsolute(linkTarget) || /^[a-zA-Z]:[/\\]/.test(linkTarget); }
function removePublicLink(target) { if (!fs.existsSync(target)) return; if (getLinkTarget(target)) { fs.unlinkSync(target); return; } try { fs.rmdirSync(target); } catch { fs.rmSync(target, { recursive: true, force: true }); } }
function syncPublicMedia() {
  const root = process.cwd();
  const publicDir = path.join(root, "public");
  for (const dirName of MEDIA_DIRS) {
    const source = path.join(root, dirName);
    const target = path.join(publicDir, dirName);
    if (!fs.existsSync(source)) continue;
    if (fs.existsSync(target)) {
      if (isExternalLink(target)) removePublicLink(target); else continue;
    }
    fs.cpSync(source, target, { recursive: true });
    console.log("Synced " + dirName + " -> public/" + dirName);
  }
}
syncPublicMedia();