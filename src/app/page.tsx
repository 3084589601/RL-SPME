import Link from "next/link";
import manifest from "@/generated/media-manifest.json";
import { getCachedHomeCertificates, getCachedHomeCarousel, getCachedLabIntro } from "@/lib/cached-data";
import { HomeHeroCarousel } from "@/components/HomeHeroCarousel";
import { ImagePreloads } from "@/components/ImagePreloads";
import { HomeHighlights, HomeCertificates } from "@/components/HomeSections";
import { HomeMemberExtras } from "@/components/HomeMemberExtras";
import { CompetitionCards } from "@/components/CompetitionCalendar";
import { isDisplayableMedia, toDisplayUrl, toThumbUrl } from "@/lib/media-url";
import { SectionHeader } from "@/components/SectionHeader";
import { StatCounter } from "@/components/StatCounter";
import { BookOpen, Users, Cpu, Eye, Bot, Code, CircuitBoard, Box } from "lucide-react";
import { TECH_CATEGORIES } from "@/lib/utils";

export const revalidate = 300;

export default async function HomePage() {
  const [{ overviewStats: rawStats }, slides, certificates] = await Promise.all([
    getCachedLabIntro(),
    getCachedHomeCarousel(),
    getCachedHomeCertificates(),
  ]);
  const overviewStats = Array.isArray(rawStats) ? rawStats : [
    { label: "学习资源", value: 500, suffix: "+" },
    { label: "荣誉证书", value: 20, suffix: "+" },
    { label: "现有成员", value: 30, suffix: "+" },
    { label: "历届成员", value: 4, suffix: "届" },
    { label: "竞赛作品", value: 10, suffix: "+" },
  ];
  const highlightItems = manifest.highlights;
  const categories = Object.entries(TECH_CATEGORIES);

  // 只预加载首张轮播图，避免 30+ 个预加载抢占带宽
  const preloadUrls = [
    ...slides.slice(0, 1).map((s) => toDisplayUrl(s.imageUrl)),
  ];

  return (
    <div>
      {/* 结构化数据 — 帮助百度/Google 理解页面内容 */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "EducationalOrganization",
            name: "贵州民族大学物理与机电工程学院机器人实验室",
            alternateName: ["贵州民族大学机器人实验室", "GZMU Robotics Lab"],
            url: "https://gzmu-robot-lab.trycloudflare.com",
            description:
              "贵州民族大学物理与机电工程学院机器人实验室，提供嵌入式开发、视觉算法、RoboMaster竞赛、学习资源与成员管理。",
            parentOrganization: {
              "@type": "CollegeOrUniversity",
              name: "贵州民族大学",
            },
            department: {
              "@type": "CollegeOrUniversity",
              name: "物理与机电工程学院",
            },
            knowsAbout: [
              "嵌入式开发", "视觉算法", "PCB设计", "SolidWorks建模",
              "AI大模型应用", "RoboMaster机甲大师赛", "电子设计竞赛",
            ],
            contactPoint: {
              "@type": "ContactPoint",
              contactType: "实验室联系",
              email: "robotics@gzmu.edu.cn",
            },
            address: {
              "@type": "PostalAddress",
              addressLocality: "贵阳市花溪区",
              addressRegion: "贵州省",
              addressCountry: "CN",
            },
          }),
        }}
      />
      <ImagePreloads urls={preloadUrls} />
      <section className="relative w-full">
        <HomeHeroCarousel slides={slides} fullBleed />
      </section>

      <section className="py-14 bg-primary text-white">
        <div className="max-w-[1200px] mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold">实验室概览</h2>
            <p className="text-blue-100 text-sm uppercase tracking-wider mt-1">Overview</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
            {overviewStats.map((stat, i) => (
              <StatCounter key={i} value={stat.value} suffix={stat.suffix} label={stat.label} light />
            ))}
          </div>
        </div>
      </section>

      {/* 学习方向 + 竞赛日历 */}
      <section className="py-14 bg-white">
        <div className="max-w-[1200px] mx-auto px-4">
          {/* 上：主要学习方向 */}
          <SectionHeader title="主要学习方向" subtitle="Learning Directions" href="/about/research" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {categories.filter(([k]) => k !== "OTHER").map(([key, cat]) => {
              const icons: Record<string, typeof Cpu> = {
                EMBEDDED: Cpu,
                VISION: Eye,
                PCB: CircuitBoard,
                SOLIDWORKS: Box,
                WECHAT_MINI: Bot,
                AI_LLM: Bot,
              };
              const Icon = icons[key] || Code;
              return (
                <Link
                  key={key}
                  href="/about/research"
                  className="group flex gap-4 items-start p-5 bg-white border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all"
                >
                  <div className={`w-11 h-11 ${cat.color} flex items-center justify-center shrink-0`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 group-hover:text-primary">{cat.label}</h3>
                    <p className="text-sm text-gray-500 mt-1">模板例程 · 学习视频 · 比赛作品</p>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* 下：竞赛日历 */}
          <SectionHeader title="竞赛日历" subtitle="Competition Calendar" />
          <CompetitionCards cols={3} />
        </div>
      </section>

      <HomeCertificates certificates={certificates} />
      <HomeHighlights items={highlightItems} />
      <HomeMemberExtras />
    </div>
  );
}
