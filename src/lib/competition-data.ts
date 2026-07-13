/** 竞赛日历数据配置
 *  日期来源：各赛事官网及高校教务处通知（2026年度）。
 *  当前日期 2026-06-20，未标注具体时刻的节点以 08:00 计。
 */

export interface CompetitionMilestone {
  label: string;
  /** ISO 8601 格式，精确到小时："2026-07-29T08:00" */
  date: string;
}

export interface Competition {
  id: string;
  name: string;
  color: string;
  url: string;
  milestones: CompetitionMilestone[];
}

export const COMPETITIONS: Competition[] = [
  {
    id: "nuedc",
    name: "全国大学生电子设计竞赛",
    color: "bg-blue-600",
    url: "https://www.nuedc-training.com.cn/",
    milestones: [
      { label: "省赛",         date: "2026-07-29T08:00" },
      { label: "国赛",         date: "2026-08-23T08:00" },
    ],
  },
  {
    id: "robomaster",
    name: "RoboMaster 机甲大师赛",
    color: "bg-red-600",
    url: "https://www.robomaster.com/",
    milestones: [
      { label: "北部赛区",     date: "2026-05-29T08:00" },
      { label: "全国赛",       date: "2026-08-01T08:00" },
    ],
  },
  {
    id: "crai",
    name: "中国机器人及人工智能大赛",
    color: "bg-purple-600",
    url: "https://www.caairobot.com/",
    milestones: [
      { label: "省赛",         date: "2026-06-07T08:00" },
      { label: "国赛",         date: "2026-07-15T08:00" },
    ],
  },
  {
    id: "roboct",
    name: "中国高校智能机器人创意大赛",
    color: "bg-emerald-600",
    url: "http://www.robotcontest.cn/",
    milestones: [
      { label: "省赛",         date: "2026-05-31T08:00" },
      { label: "决赛",         date: "2026-07-12T08:00" },
    ],
  },
  {
    id: "siemens",
    name: "CIMC“西门子杯”中国智能制造挑战赛",
    color: "bg-amber-600",
    url: "https://www.siemenscup-cimc.org.cn/",
    milestones: [
      { label: "初赛(省赛)",   date: "2026-07-13T08:00" },
      { label: "国赛",         date: "2026-08-12T08:00" },
    ],
  },
  {
    id: "gcxl",
    name: "中国大学生工程实践与创新能力大赛",
    color: "bg-cyan-600",
    url: "https://www.gcxl.edu.cn/",
    milestones: [
      { label: "报名开始",     date: "2026-09-15T08:00" },
      { label: "省赛",         date: "2027-03-15T08:00" },
      { label: "国赛",         date: "2027-05-20T08:00" },
    ],
  },
];
