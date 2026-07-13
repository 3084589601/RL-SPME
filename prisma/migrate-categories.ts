import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/** 将旧分类迁移为新学习方向（STM32/MCU→嵌入式，YOLO→视觉） */
async function main() {
  const migrations = [
    "UPDATE Resource SET category = 'EMBEDDED' WHERE category IN ('STM32', 'MCU')",
    "UPDATE Resource SET category = 'VISION' WHERE category = 'YOLO'",
    "UPDATE StudySession SET category = 'EMBEDDED' WHERE category IN ('STM32', 'MCU')",
    "UPDATE StudySession SET category = 'VISION' WHERE category = 'YOLO'",
  ];

  for (const sql of migrations) {
    try {
      const count = await prisma.$executeRawUnsafe(sql);
      console.log(`OK: ${sql} (${count} rows)`);
    } catch (error) {
      console.warn(`Skip: ${sql}`, error);
    }
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
