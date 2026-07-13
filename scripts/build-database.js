const { execSync } = require("child_process");

function run(cmd) {
  console.log(">", cmd);
  execSync(cmd, { stdio: "inherit" });
}

try {
  run("npx prisma db push --skip-generate");
  run("npx tsx prisma/seed.ts");
  console.log("Database ready for deploy");
} catch (error) {
  console.warn("Database setup skipped:", error.message);
}