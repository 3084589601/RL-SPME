const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

function run(cmd) {
  console.log(">", cmd);
  execSync(cmd, { stdio: "inherit" });
}

const dbPath = path.join(__dirname, "..", "prisma", "dev.db");

try {
  if (!fs.existsSync(dbPath)) {
    run("npx prisma db push --skip-generate");
    run("npx tsx prisma/seed.ts");
    console.log("Database created + seeded");
  } else {
    run("npx prisma db push --skip-generate");
    console.log("Database schema synced (data preserved)");
  }
} catch (error) {
  console.warn("Database setup skipped:", error.message);
}
