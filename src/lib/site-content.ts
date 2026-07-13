import { prisma } from "@/lib/prisma";
import { withDatabase } from "@/lib/safe-database";
import manifest from "@/generated/media-manifest.json";

export type CompetitionItem = {
  name: string;
  level?: string;
  period?: string;
  description?: string;
};

export type FacultyItem = {
  name: string;
  title: string;
  photo?: string;
  research?: string;
  description?: string;
  honors?: string[];
};

/** 学生管理员角色 */
export type StudentAdminRole =
  | "principal"
  | "publicist"
  | "finance"
  | "logistics"
  | "credit"
  | "it_ops";

export type StudentAdminItem = {
  name: string;
  role: StudentAdminRole;
  photo?: string;
  description?: string;
  honors?: string[];
};

export const STUDENT_ADMIN_ROLE_META: Record<StudentAdminRole, { label: string; color: string; order: number }> = {
  principal:  { label: "实验室主要负责人",   color: "bg-blue-600",   order: 1 },
  publicist:  { label: "实验室宣传员",       color: "bg-pink-500",   order: 2 },
  finance:    { label: "实验室财务",         color: "bg-emerald-600", order: 3 },
  logistics:  { label: "实验室后勤",         color: "bg-amber-600",  order: 4 },
  credit:     { label: "实验室学分管理员",   color: "bg-purple-600", order: 5 },
  it_ops:     { label: "信息化运维管理员",   color: "bg-cyan-600",   order: 6 },
};

export const STUDENT_ADMIN_ROLE_ORDER: StudentAdminRole[] = [
  "principal", "publicist", "finance", "logistics", "credit", "it_ops",
];

export type ContactInfo = {
  address: string;
  email: string;
  phone: string;
  hours?: string;
};

export type RecruitmentInfo = {
  intro: string;
  requirements: string[];
  applyNote: string;
};

export type OverviewStatItem = {
  label: string;
  value: number;
  suffix: string;
};

export type OverviewStats = OverviewStatItem[];

export type LabIntroContent = {
  overview: string;
  equipment: string[];
  research: string[];
  competitions: CompetitionItem[];
  faculty: FacultyItem[];
  studentAdmins: StudentAdminItem[];
  contact: string;
  contactInfo: ContactInfo;
  recruitment: RecruitmentInfo;
  overviewStats: OverviewStats;
};

export const DEFAULT_LAB_INTRO: LabIntroContent = {
  overview:
    "贵州民族大学物理与机电工程学院机器人实验室成立于2018年，是学院重点建设的创新实践平台。实验室面向全院学生开放，致力于培养具有创新精神和工程实践能力的复合型人才。",
  equipment: [
    "STM32、Arduino、ESP32 等主流开发板",
    "Jetson Nano / Orin 边缘计算平台",
    "六自由度机械臂、移动机器人平台",
    "工业相机与视觉识别套件",
    "3D 打印机、示波器、逻辑分析仪",
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
    {
      name: "RoboMaster 机器人大赛",
      level: "国家级",
      period: "2019—2024",
      description: "参与机甲对抗、工程机器人等赛项，多次获得区域赛奖项。",
    },
    {
      name: "中国机器人及人工智能大赛",
      level: "国家级 A 类",
      period: "2020—2024",
      description: "涵盖视觉、导航、协作机器人等多个赛道。",
    },
    {
      name: "全国大学生智能汽车竞赛",
      level: "国家级",
      period: "2021—2024",
      description: "电磁组、视觉组智能车设计与调试。",
    },
    {
      name: "互联网+大学生创新创业大赛",
      level: "省级",
      period: "2022—2024",
      description: "机器人相关创新项目孵化与参赛。",
    },
  ],
  faculty: [
    {
      name: "王教授",
      title: "实验室指导教师",
      photo: "",
      research: "机器人控制 · 智能感知",
      description: "教授，硕士生导师。长期从事机电一体化与智能机器人教学科研工作，主持多项省级科研项目，指导学生在 RoboMaster、电子设计竞赛等赛事中多次获奖。",
      honors: ["省级教学成果一等奖", "RoboMaster 机甲大师赛优秀指导教师", "全国大学生电子设计竞赛优秀指导教师"],
    },
    {
      name: "李老师",
      title: "竞赛指导教师",
      photo: "",
      research: "视觉算法 · 嵌入式开发",
      description: "讲师，主要研究方向为计算机视觉与嵌入式系统。负责 RoboMaster 机甲大师赛、智能车竞赛等队伍的技术训练与战术指导，经验丰富。",
      honors: ["中国机器人及人工智能大赛优秀指导教师", "全国大学生智能汽车竞赛优秀指导教师", "指导学生获国家级奖项 5 项"],
    },
    {
      name: "张老师",
      title: "实验指导教师",
      photo: "",
      research: "设备维护 · 项目实践",
      description: "实验师，负责实验室日常管理、仪器设备维护及耗材采购。指导学生开展工程实践项目，在 3D 打印与机械加工方面有丰富实操经验。",
      honors: ["校级实验室管理先进个人", "指导学生获省级大创项目立项 3 项"],
    },
  ],
  studentAdmins: [
    {
      name: "待定",
      role: "principal",
      photo: "",
      description: "全面统筹实验室建设规划、年度工作安排与对外联络，主持实验室例会，协调各岗位工作，对实验室整体运行负责。",
      honors: [],
    },
    {
      name: "待定",
      role: "publicist",
      photo: "",
      description: "运营实验室微信公众号与新媒体账号，策划制作宣传内容，撰写活动推文与新闻稿，设计海报及招新材料，提升实验室影响力。",
      honors: [],
    },
    {
      name: "待定",
      role: "finance",
      photo: "",
      description: "管理实验室专项经费与日常开支，负责采购审批、票据整理与财务报销，编制年度经费预算与支出报告，确保账目清晰合规。",
      honors: [],
    },
    {
      name: "待定",
      role: "logistics",
      photo: "",
      description: "负责实验室场地日常维护、设备物资登记与管理，保障实验环境安全整洁，管理耗材库存并及时补充，协调设备借用与归还。",
      honors: [],
    },
    {
      name: "待定",
      role: "credit",
      photo: "",
      description: "制定并执行实验室成员学分认定办法，记录成员出勤、学习时长与竞赛成果，定期公示学分统计，对接学院学分管理系统。",
      honors: [],
    },
    {
      name: "待定",
      role: "it_ops",
      photo: "",
      description: "维护实验室服务器、网络设备与信息化系统，管理网站内容更新与功能迭代，保障数据安全与系统稳定运行，提供技术支持。",
      honors: [],
    },
  ],
  contact:
    "地址：贵州省贵阳市花溪区贵州民族大学物理与机电工程学院\n邮箱：robotics@gzmu.edu.cn\n电话：0851-XXXXXXX\n开放时间：周一至周五 9:00—21:00",
  contactInfo: {
    address: "贵州省贵阳市花溪区贵州民族大学物理与机电工程学院",
    email: "robotics@gzmu.edu.cn",
    phone: "0851-XXXXXXX",
    hours: "周一至周五 9:00—21:00",
  },
  recruitment: {
    intro:
      "机器人实验室面向全院本科生、研究生开放招新，欢迎对嵌入式开发、视觉算法、机器人竞赛感兴趣的同学加入。",
    requirements: [
      "对机器人、单片机、编程或人工智能有浓厚兴趣",
      "能保证每周至少 6 小时参与实验室学习与实践",
      "有责任心，具备团队协作精神，愿意参加竞赛与项目",
      "愿意学习编程或硬件相关知识，零基础亦可申请",
    ],
    applyNote: "请将个人简介、联系方式及兴趣方向发送至实验室邮箱，或通过成员登录提交申请。招新时间：每年 3 月、9 月。",
  },
  overviewStats: [
    { label: "学习资源", value: 500, suffix: "+" },
    { label: "荣誉证书", value: 20, suffix: "+" },
    { label: "现有成员", value: 30, suffix: "+" },
    { label: "历届成员", value: 4, suffix: "届" },
    { label: "竞赛作品", value: 10, suffix: "+" },
  ],
};

export type CarouselSlideData = {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  link?: string | null;
};

export async function getHomeCarousel(): Promise<CarouselSlideData[]> {
  return withDatabase(manifest.carousel, async () => {
    const row = await prisma.siteContent.findUnique({ where: { key: "home_carousel" } });
    if (row) {
      try {
        const slides = JSON.parse(row.content) as CarouselSlideData[];
        if (Array.isArray(slides) && slides.length > 0) return slides;
      } catch {
        /* fall through */
      }
    }

    const { getCarouselSlidesFromFolder } = await import("@/lib/media");
    const folderSlides = getCarouselSlidesFromFolder();
    return folderSlides.length > 0 ? folderSlides : manifest.carousel;
  });
}

export async function getLabIntro(): Promise<LabIntroContent> {
  return withDatabase(DEFAULT_LAB_INTRO, async () => {
    const row = await prisma.siteContent.findUnique({ where: { key: "lab_intro" } });
    if (!row) return DEFAULT_LAB_INTRO;

    try {
      const parsed = JSON.parse(row.content) as Partial<LabIntroContent>;
      const contactInfo = resolveContactInfo(parsed);
      return {
        overview: parsed.overview ?? DEFAULT_LAB_INTRO.overview,
        equipment: parsed.equipment?.length ? parsed.equipment : DEFAULT_LAB_INTRO.equipment,
        research: parsed.research?.length ? parsed.research : DEFAULT_LAB_INTRO.research,
        competitions: parsed.competitions?.length ? parsed.competitions : DEFAULT_LAB_INTRO.competitions,
        faculty: parsed.faculty?.length ? parsed.faculty : DEFAULT_LAB_INTRO.faculty,
        studentAdmins: parsed.studentAdmins?.length ? parsed.studentAdmins : DEFAULT_LAB_INTRO.studentAdmins,
        contact: parsed.contact ?? buildContactText(contactInfo),
        contactInfo,
        recruitment: resolveRecruitment(parsed),
        overviewStats: resolveOverviewStats(parsed),
      };
    } catch {
      return DEFAULT_LAB_INTRO;
    }
  });
}

export function parseContactLines(contact: string) {
  return contact
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const sep = line.indexOf("：") >= 0 ? "：" : ":";
      const idx = line.indexOf(sep);
      if (idx <= 0) return { label: "", value: line };
      return { label: line.slice(0, idx), value: line.slice(idx + 1).trim() };
    });
}

function resolveContactInfo(parsed: Partial<LabIntroContent>): ContactInfo {
  if (parsed.contactInfo?.address && parsed.contactInfo?.email) {
    return {
      address: parsed.contactInfo.address,
      email: parsed.contactInfo.email,
      phone: parsed.contactInfo.phone ?? DEFAULT_LAB_INTRO.contactInfo.phone,
      hours: parsed.contactInfo.hours ?? DEFAULT_LAB_INTRO.contactInfo.hours,
    };
  }

  const contact = parsed.contact ?? DEFAULT_LAB_INTRO.contact;
  const lines = parseContactLines(contact);
  const pick = (label: string, fallback: string) =>
    lines.find((l) => l.label === label)?.value ?? fallback;

  return {
    address: pick("地址", DEFAULT_LAB_INTRO.contactInfo.address),
    email: pick("邮箱", DEFAULT_LAB_INTRO.contactInfo.email),
    phone: pick("电话", DEFAULT_LAB_INTRO.contactInfo.phone),
    hours: pick("开放时间", DEFAULT_LAB_INTRO.contactInfo.hours ?? ""),
  };
}

function resolveRecruitment(parsed: Partial<LabIntroContent>): RecruitmentInfo {
  if (parsed.recruitment?.intro) {
    return {
      intro: parsed.recruitment.intro,
      requirements: parsed.recruitment.requirements?.length
        ? parsed.recruitment.requirements
        : DEFAULT_LAB_INTRO.recruitment.requirements,
      applyNote: parsed.recruitment.applyNote ?? DEFAULT_LAB_INTRO.recruitment.applyNote,
    };
  }
  return DEFAULT_LAB_INTRO.recruitment;
}

function resolveOverviewStats(parsed: Partial<LabIntroContent>): OverviewStats {
  const d = DEFAULT_LAB_INTRO.overviewStats;
  const s = parsed.overviewStats;
  if (!s) return d;
  // 新格式（数组）
  if (Array.isArray(s) && s.length > 0) return s as OverviewStats;
  // 兼容旧格式（固定对象）
  if (!Array.isArray(s)) {
    const old = s as Record<string, number>;
    return [
      { label: "学习资源", value: old.resources ?? 500, suffix: "+" },
      { label: "荣誉证书", value: old.certificates ?? 20, suffix: "+" },
      { label: "现有成员", value: old.alumniMembers ?? 30, suffix: "+" },
      { label: "历届成员", value: 4, suffix: "届" },
      { label: "竞赛作品", value: old.competitionWorks ?? 10, suffix: "+" },
    ];
  }
  return d;
}

export function buildContactText(info: ContactInfo): string {
  const lines = [
    `地址：${info.address}`,
    `邮箱：${info.email}`,
    `电话：${info.phone}`,
  ];
  if (info.hours) lines.push(`开放时间：${info.hours}`);
  return lines.join("\n");
}
