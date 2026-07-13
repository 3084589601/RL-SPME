export type CompetitionItem = {
  name: string;
  level?: string;
  period?: string;
  description?: string;
};

export type FacultyItem = {
  name: string;
  title: string;
  research?: string;
  description?: string;
};

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
      research: "机器人控制 · 智能感知",
      description: "长期从事机电一体化与智能机器人教学科研工作。",
    },
    {
      name: "李老师",
      title: "竞赛指导教师",
      research: "视觉算法 · 嵌入式开发",
      description: "负责 RoboMaster、智能车等竞赛队伍训练与指导。",
    },
    {
      name: "张老师",
      title: "实验指导教师",
      research: "设备维护 · 项目实践",
      description: "负责实验室日常管理与学生工程实践指导。",
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

