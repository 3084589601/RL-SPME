import { PrismaClient, Role, ResourceStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import { copyFile, mkdir, stat } from "fs/promises";
import path from "path";

const prisma = new PrismaClient();

function isPlaceholderMedia(url: string | null | undefined): boolean {
  if (!url?.trim()) return true;
  return /placeholder-gallery|placeholder\.svg|\/placeholder[-_]/i.test(url);
}

async function copySeedTemplateFile(sourceName: string): Promise<{
  filePath: string;
  fileName: string;
  fileSize: number;
}> {
  const uploadDir = path.join(process.cwd(), "uploads");
  await mkdir(uploadDir, { recursive: true });
  const sourcePath = path.join(process.cwd(), "prisma", "seed-files", sourceName);
  const storedName = `seed-${sourceName}`;
  const targetPath = path.join(uploadDir, storedName);
  await copyFile(sourcePath, targetPath);
  const { size } = await stat(targetPath);
  return { filePath: storedName, fileName: sourceName, fileSize: size };
}

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  const memberPassword = await bcrypt.hash("member123", 10);

  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      name: "系统管理员",
      email: "admin@gzmu.edu.cn",
      role: Role.ADMIN,
    },
  });

  const member = await prisma.user.upsert({
    where: { username: "member" },
    update: {},
    create: {
      username: "member",
      password: memberPassword,
      name: "张三",
      email: "zhangsan@gzmu.edu.cn",
      role: Role.MEMBER,
    },
  });

  await prisma.siteContent.upsert({
    where: { key: "lab_intro" },
    update: {},
    create: {
      key: "lab_intro",
      title: "实验室概况",
      content: JSON.stringify({
        overview: "贵州民族大学物理与机电工程学院机器人实验室成立于2018年，是学院重点建设的创新实践平台。实验室面向全院学生开放，致力于培养具有创新精神和工程实践能力的复合型人才。",
        equipment: [
          "STM32、Arduino、ESP32等主流开发板",
          "Jetson Nano / Orin 边缘计算平台",
          "六自由度机械臂、移动机器人平台",
          "工业相机与视觉识别套件",
          "3D打印机、示波器、逻辑分析仪",
        ],
        research: [
          "嵌入式开发（STM32、Arduino、ESP32 等）",
          "视觉算法与智能识别",
          "PCB 电路设计与制板",
          "SolidWorks 三维建模与结构设计",
          "微信小程序与物联网系统集成",
          "AI 大模型在机器人领域的应用",
        ],
        competitions: [
          { name: "RoboMaster 机器人大赛", level: "国家级", period: "2019-2024", description: "参与机甲对抗、工程机器人等赛项，多次获得区域赛奖项。" },
          { name: "中国机器人及人工智能大赛", level: "国家级A类", period: "2020-2024", description: "涵盖视觉、导航、协作机器人等多个赛道。" },
          { name: "全国大学生智能汽车竞赛", level: "国家级", period: "2021-2024", description: "电磁组、视觉组智能车设计与调试。" },
          { name: "互联网+大学生创新创业大赛", level: "省级", period: "2022-2024", description: "机器人相关创新项目孵化与参赛。" },
        ],
        faculty: [
          { name: "王教授", title: "实验室指导教师", research: "机器人控制 · 智能感知", description: "长期从事机电一体化与智能机器人教学科研工作。" },
          { name: "李老师", title: "竞赛指导教师", research: "视觉算法 · 嵌入式开发", description: "负责 RoboMaster、智能车等竞赛队伍训练与指导。" },
          { name: "张老师", title: "实验指导教师", research: "设备维护 · 项目实践", description: "负责实验室日常管理与学生工程实践指导。" },
        ],
        contact: "地址：贵州民族大学物理与机电工程学院\n邮箱：robotics@gzmu.edu.cn\n电话：0851-XXXXXXX\n开放时间：周一至周五 9:00-21:00",
        contactInfo: {
          address: "贵州省贵阳市花溪区贵州民族大学物理与机电工程学院",
          email: "robotics@gzmu.edu.cn",
          phone: "0851-XXXXXXX",
          hours: "周一至周五 9:00-21:00",
        },
        recruitment: {
          intro: "机器人实验室面向全院本科生、研究生开放招新，欢迎对嵌入式开发、视觉算法、机器人竞赛感兴趣的同学加入。",
          requirements: [
            "对机器人、单片机、编程或人工智能有浓厚兴趣",
            "能保证每周至少 6 小时参与实验室学习与实践",
            "有责任心，具备团队协作精神，愿意参加竞赛与项目",
            "愿意学习编程或硬件相关知识，零基础亦可申请",
          ],
          applyNote: "请将个人简介、联系方式及兴趣方向发送至实验室邮箱，或通过成员登录提交申请。招新时间：每年 3 月、9 月。",
        },
        overviewStats: {
          resources: 500,
          certificates: 20,
          alumniMembers: 3,
          competitionWorks: 5,
        },
      }),
    },
  });

  const overviewStats = {
    resources: 500,
    certificates: 20,
    alumniMembers: 3,
    competitionWorks: 5,
  };

  const labIntroRow = await prisma.siteContent.findUnique({ where: { key: "lab_intro" } });
  if (labIntroRow) {
    try {
      const labIntroData = JSON.parse(labIntroRow.content) as Record<string, unknown>;
      labIntroData.overviewStats = overviewStats;
      await prisma.siteContent.update({
        where: { key: "lab_intro" },
        data: { content: JSON.stringify(labIntroData) },
      });
    } catch {
      /* keep existing content if parse fails */
    }
  }

  await prisma.siteContent.upsert({
    where: { key: "home_carousel" },
    update: {},
    create: {
      key: "home_carousel",
      title: "首页轮播",
      content: JSON.stringify([
        { id: "1", title: "机器人实验室", subtitle: "贵州民族大学物理与机电工程学院", imageUrl: "/banners/banner-1.svg", link: "/about" },
        { id: "2", title: "视觉算法", subtitle: "目标检测 · 视觉导航 · 智能识别", imageUrl: "/banners/banner-2.svg", link: "/resources?category=VISION" },
        { id: "3", title: "嵌入式开发", subtitle: "STM32 · Arduino · 传感器驱动", imageUrl: "/banners/banner-3.svg", link: "/resources?category=EMBEDDED" },
        { id: "4", title: "机器人竞赛", subtitle: "RoboMaster · 智能车 · 人工智能大赛", imageUrl: "/banners/banner-4.svg", link: "/gallery" },
      ]),
    },
  });

  const certificates = [
    {
      title: "第二十五届全国大学生机器人大赛-RoboMaster2026机甲大师高校联盟赛-步兵对抗赛优秀奖",
      year: 2026,
      description: "RoboMaster 2026 机甲大师高校联盟赛",
      imageUrl: "/荣誉证书/第二十五届全国大学生机器人大赛-RoboMaster2026机甲大师高校联盟赛-步兵对抗赛优秀奖.jpg",
      position: "left",
      row: 0,
      order: 0,
    },
    {
      title: "2025年第八届中国高校智能机器人创意大赛一等奖",
      year: 2025,
      description: "中国高校智能机器人创意大赛",
      imageUrl: "/荣誉证书/2025年第八届中国高校智能机器人创意大赛一等奖.jpg",
      position: "grid",
      row: 0,
      order: 0,
    },
    {
      title: "第二十七届中国机器人及人工智能大赛贵州赛区二等奖",
      year: 2024,
      description: "中国机器人及人工智能大赛贵州赛区",
      imageUrl: "/荣誉证书/第二十七届中国机器人及人工智能大赛贵州赛区二等奖.jpg",
      position: "grid",
      row: 0,
      order: 1,
    },
    {
      title: "第二十七届中国机器人及人工智能大赛全国总决赛三等奖",
      year: 2024,
      description: "中国机器人及人工智能大赛全国总决赛",
      imageUrl: "/荣誉证书/第二十七届中国机器人及人工智能大赛全国总决赛三等奖.jpg",
      position: "grid",
      row: 0,
      order: 2,
    },
    {
      title: "第二十七届中国机器人及人工智能大赛全国总决赛优秀奖",
      year: 2024,
      description: "中国机器人及人工智能大赛全国总决赛",
      imageUrl: "/荣誉证书/第二十七届中国机器人及人工智能大赛全国总决赛优秀奖.jpg",
      position: "grid",
      row: 0,
      order: 3,
    },
  ];

  await prisma.certificate.deleteMany({
    where: {
      imageUrl: { contains: "placeholder" },
    },
  });

  for (const cert of certificates) {
    const existing = await prisma.certificate.findFirst({ where: { title: cert.title } });
    if (existing) {
      await prisma.certificate.update({
        where: { id: existing.id },
        data: {
          description: cert.description,
          year: cert.year,
          order: cert.order,
          row: cert.row,
          position: cert.position,
          imageUrl: cert.imageUrl,
        },
      });
    } else {
      await prisma.certificate.create({
        data: {
          title: cert.title,
          description: cert.description,
          year: cert.year,
          order: cert.order,
          row: cert.row,
          position: cert.position,
          imageUrl: cert.imageUrl,
        },
      });
    }
  }

  const momentImages = (start: number) =>
    Array.from({ length: 6 }, (_, i) => `/uploads/placeholder-gallery-${((start + i - 1) % 6) + 1}.svg`);

  const workHighlights = (demoIndex: number, momentStart: number) =>
    JSON.stringify({
      demoVideo: "https://www.bilibili.com/video/BV1xx411c7mD",
      momentImages: momentImages(momentStart),
    });

  const galleryItems = [
    {
      title: "2024届实验室成员",
      type: "member",
      year: 2024,
      description: "2024届核心成员合影",
    },
    {
      title: "2023届实验室成员",
      type: "member",
      year: 2023,
      description: "2023届成员合影",
    },
    {
      title: "HomeFit智能健身助手机器人",
      type: "work",
      year: 2026,
      imageIndex: 1,
      description:
        "面向居家健身场景的智能助手机器人，融合姿态识别与训练指导，帮助用户规范动作、记录训练数据。参赛赛事：中国高校智能机器人创意大赛、中国机器人及人工智能大赛。",
      teamName: "HomeFit 战队",
      teamPhotoUrl: "/uploads/placeholder-gallery-1.svg",
      membersJson: JSON.stringify([
        { name: "队员 A", role: "队长 · 电控" },
        { name: "队员 B", role: "视觉算法" },
        { name: "队员 C", role: "机械结构" },
        { name: "队员 D", role: "嵌入式开发" },
      ]),
      highlightsJson: workHighlights(1, 1),
    },
    {
      title: "LumiCare 暖芯药伴",
      type: "work",
      year: 2026,
      imageIndex: 2,
      description:
        "智能用药提醒与陪伴机器人，支持分时段提醒、用药记录与语音交互，为老人及慢性病患者提供贴心照护。参赛赛事：中国高校智能机器人创意大赛、中国机器人及人工智能大赛。",
      teamName: "LumiCare 战队",
      teamPhotoUrl: "/uploads/placeholder-gallery-2.svg",
      membersJson: JSON.stringify([
        { name: "队员 A", role: "队长 · 产品设计" },
        { name: "队员 B", role: "硬件开发" },
        { name: "队员 C", role: "小程序开发" },
        { name: "队员 D", role: "交互设计" },
      ]),
      highlightsJson: workHighlights(2, 2),
    },
    {
      title: "PetCare宠伴无忧",
      type: "work",
      year: 2026,
      imageIndex: 3,
      description:
        "智能宠物陪伴与看护机器人，具备远程互动、行为监测与喂食提醒功能，让宠物主外出更安心。参赛赛事：中国高校智能机器人创意大赛、中国机器人及人工智能大赛。",
      teamName: "PetCare 战队",
      teamPhotoUrl: "/uploads/placeholder-gallery-3.svg",
      membersJson: JSON.stringify([
        { name: "队员 A", role: "队长 · 机械" },
        { name: "队员 B", role: "视觉识别" },
        { name: "队员 C", role: "物联网开发" },
        { name: "队员 D", role: "App 开发" },
      ]),
      highlightsJson: workHighlights(3, 3),
    },
    {
      title: "SmartTalk灵语桌宠",
      type: "work",
      year: 2026,
      imageIndex: 4,
      description:
        "桌面智能语音陪伴机器人，支持自然语言对话、情绪表达与日程提醒，打造有温度的桌面智能伙伴。参赛赛事：中国高校智能机器人创意大赛、中国机器人及人工智能大赛。",
      teamName: "SmartTalk 战队",
      teamPhotoUrl: "/uploads/placeholder-gallery-4.svg",
      membersJson: JSON.stringify([
        { name: "队员 A", role: "队长 · 语音交互" },
        { name: "队员 B", role: "大模型应用" },
        { name: "队员 C", role: "结构设计" },
        { name: "队员 D", role: "嵌入式" },
      ]),
      highlightsJson: workHighlights(4, 4),
    },
    {
      title: "JoyCube 乐立方伴",
      type: "work",
      year: 2026,
      imageIndex: 5,
      description:
        "智能陪伴互动立方体机器人，集触控交互、灯光反馈与益智游戏于一体，适用于儿童陪伴与互动娱乐场景。参赛赛事：中国机器人及人工智能大赛。",
      teamName: "JoyCube 战队",
      teamPhotoUrl: "/uploads/placeholder-gallery-5.svg",
      membersJson: JSON.stringify([
        { name: "队员 A", role: "队长 · 电控" },
        { name: "队员 B", role: "游戏逻辑" },
        { name: "队员 C", role: "外壳设计" },
        { name: "队员 D", role: "传感器驱动" },
      ]),
      highlightsJson: workHighlights(5, 5),
    },
  ];

  const workTitles = galleryItems.filter((item) => item.type === "work").map((item) => item.title);
  await prisma.galleryItem.deleteMany({
    where: {
      type: "work",
      title: { notIn: workTitles },
    },
  });

  for (let i = 0; i < galleryItems.length; i++) {
    const item = galleryItems[i];
    const existing = await prisma.galleryItem.findFirst({ where: { title: item.title } });
    const imageUrl =
      item.type === "work" && "imageIndex" in item
        ? `/uploads/placeholder-gallery-${item.imageIndex}.svg`
        : `/uploads/placeholder-gallery-${i + 1}.svg`;
    const detailFields = {
      teamName: "teamName" in item ? item.teamName : undefined,
      teamPhotoUrl: "teamPhotoUrl" in item ? item.teamPhotoUrl : undefined,
      membersJson: "membersJson" in item ? item.membersJson : undefined,
      highlightsJson: "highlightsJson" in item ? item.highlightsJson : undefined,
    };

    if (!existing) {
      await prisma.galleryItem.create({
        data: {
          title: item.title,
          description: item.description,
          type: item.type,
          year: item.year,
          order: i,
          imageUrl,
          ...detailFields,
        },
      });
    } else if (item.type === "work") {
      const updateData: Record<string, unknown> = {
        description: item.description,
        year: item.year,
        order: i,
      };

      if (isPlaceholderMedia(existing.imageUrl)) updateData.imageUrl = imageUrl;
      if (isPlaceholderMedia(existing.teamPhotoUrl)) {
        updateData.teamPhotoUrl = detailFields.teamPhotoUrl;
      }
      if (!existing.highlightsJson || existing.highlightsJson.includes("placeholder")) {
        updateData.highlightsJson = detailFields.highlightsJson;
      }
      if (!existing.membersJson) updateData.membersJson = detailFields.membersJson;

      await prisma.galleryItem.update({
        where: { id: existing.id },
        data: updateData,
      });
    }
  }

  const templateFileMap: Record<string, string> = {
    "STM32 LED闪烁例程": "stm32-led.c",
    "STM32 UART串口通信例程": "stm32-uart.c",
    "Arduino 传感器读取例程": "arduino-sensors.ino",
  };

  const templateFiles = new Map<
    string,
    { filePath: string; fileName: string; fileSize: number }
  >();
  for (const [title, sourceName] of Object.entries(templateFileMap)) {
    templateFiles.set(title, await copySeedTemplateFile(sourceName));
  }

  const resources = [
    {
      title: "STM32 LED闪烁例程",
      description: "基于HAL库的GPIO控制基础例程，适合入门学习",
      type: "TEMPLATE",
      category: "EMBEDDED",
      status: ResourceStatus.APPROVED,
    },
    {
      title: "STM32 UART串口通信例程",
      description: "串口收发数据示例，含中断与DMA两种方式",
      type: "TEMPLATE",
      category: "EMBEDDED",
      status: ResourceStatus.APPROVED,
    },
    {
      title: "Arduino 传感器读取例程",
      description: "温湿度、超声波等常用传感器驱动",
      type: "TEMPLATE",
      category: "EMBEDDED",
      status: ResourceStatus.APPROVED,
    },
    {
      title: "YOLOv8 目标检测训练教程",
      description: "B站视频：从零开始训练自定义数据集",
      type: "VIDEO",
      category: "VISION",
      videoUrl: "https://www.bilibili.com/video/BV1xx411c7mD",
      status: ResourceStatus.APPROVED,
    },
    {
      title: "OpenCV 图像处理入门",
      description: "B站视频：OpenCV基础与实战",
      type: "VIDEO",
      category: "VISION",
      videoUrl: "https://www.bilibili.com/video/BV1GJ411x7h7",
      status: ResourceStatus.APPROVED,
    },
    {
      title: "微信小程序云开发入门",
      description: "B站视频：小程序+云数据库实战",
      type: "VIDEO",
      category: "WECHAT_MINI",
      videoUrl: "https://www.bilibili.com/video/BV1S4411c7Q4",
      status: ResourceStatus.APPROVED,
    },
    {
      title: "LangChain 大模型应用开发",
      description: "B站视频：基于LangChain构建AI应用",
      type: "VIDEO",
      category: "AI_LLM",
      videoUrl: "https://www.bilibili.com/video/BV1Lh411P7qE",
      status: ResourceStatus.APPROVED,
    },
    {
      title: "PCB 设计入门（嘉立创 EDA）",
      description: "B站视频：从原理图到 PCB 布局基础",
      type: "VIDEO",
      category: "PCB",
      videoUrl: "https://www.bilibili.com/video/BV1xx411c7mD",
      status: ResourceStatus.APPROVED,
    },
    {
      title: "SolidWorks 三维建模基础",
      description: "B站视频：零件建模与装配入门",
      type: "VIDEO",
      category: "SOLIDWORKS",
      videoUrl: "https://www.bilibili.com/video/BV1GJ411x7h7",
      status: ResourceStatus.APPROVED,
    },
    {
      title: "2024 RoboMaster 步兵机器人",
      description: "2024年RoboMaster中部区域赛参赛作品",
      type: "COMPETITION",
      category: "EMBEDDED",
      competition: "RoboMaster",
      year: 2024,
      status: ResourceStatus.APPROVED,
    },
    {
      title: "2023 智能视觉识别小车",
      description: "2023年中国机器人及人工智能大赛作品",
      type: "COMPETITION",
      category: "VISION",
      competition: "中国机器人及人工智能大赛",
      year: 2023,
      status: ResourceStatus.APPROVED,
    },
  ];

  for (const res of resources) {
    const files = templateFiles.get(res.title);
    const existing = await prisma.resource.findFirst({ where: { title: res.title } });
    const fileData = files
      ? {
          filePath: files.filePath,
          fileName: files.fileName,
          fileSize: files.fileSize,
        }
      : {};

    if (!existing) {
      await prisma.resource.create({
        data: { ...res, ...fileData, authorId: admin.id },
      });
    } else if (files) {
      await prisma.resource.update({
        where: { id: existing.id },
        data: fileData,
      });
    }
  }

  const studyData = [
    { category: "EMBEDDED", duration: 10800 },
    { category: "VISION", duration: 5400 },
    { category: "PCB", duration: 2400 },
    { category: "SOLIDWORKS", duration: 1800 },
    { category: "WECHAT_MINI", duration: 1800 },
    { category: "AI_LLM", duration: 2700 },
  ];

  for (const study of studyData) {
    const existing = await prisma.studySession.findFirst({
      where: { userId: member.id, category: study.category },
    });
    if (!existing) {
      await prisma.studySession.create({
        data: { userId: member.id, ...study },
      });
    }
  }

  console.log("Seed completed!");
  console.log("Admin: admin / admin123");
  console.log("Member: member / member123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
