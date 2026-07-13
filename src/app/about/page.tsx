import { AboutPageShell } from "@/components/AboutPageShell";
import { getCachedLabIntro } from "@/lib/cached-data";
import Link from "next/link";
import { Users, Trophy, Cpu, BookOpen } from "lucide-react";

export const revalidate = 300;

const FALLBACK_STATS = [
  { label: "学习资源", value: 500, suffix: "+" },
  { label: "荣誉证书", value: 20, suffix: "+" },
  { label: "现有成员", value: 30, suffix: "+" },
  { label: "历届成员", value: 4, suffix: "届" },
  { label: "竞赛作品", value: 10, suffix: "+" },
];

export default async function AboutIntroPage() {
  const data = await getCachedLabIntro();
  const stats = Array.isArray(data.overviewStats) ? data.overviewStats : FALLBACK_STATS;

  return (
    <AboutPageShell>
      <div className="space-y-6">
        {/* 实验室简介卡片 */}
        <article className="gznu-panel bg-white border border-gray-100 shadow-sm p-6 md:p-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-1 h-8 bg-primary rounded-full" />
            <h2 className="text-xl font-bold text-gray-900">实验室简介</h2>
          </div>
          <p className="text-gray-600 leading-relaxed text-base md:text-lg">{data.overview}</p>
        </article>

        {/* 统计数据 */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {stats.map((stat, i) => {
            const icons = [BookOpen, Trophy, Users, Cpu, BookOpen];
            const colors = ["text-primary", "text-amber-500", "text-green-500", "text-purple-500", "text-primary"];
            const Icon = icons[i % icons.length];
            return (
              <div key={i} className="gznu-panel bg-white border border-gray-100 p-5 text-center hover:border-primary/30 transition-colors">
                <Icon className={`w-7 h-7 ${colors[i % colors.length]} mx-auto mb-2`} />
                <div className="text-2xl font-bold text-gray-900">{stat.value}{stat.suffix}</div>
                <div className="text-sm text-gray-500 mt-1">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* 快速导航 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { href: "/about/research", label: "研究方向", desc: "探索前沿技术领域", icon: "🔬" },
            { href: "/about/competitions", label: "竞赛赛事", desc: "竞技舞台展现实力", icon: "🏆" },
            { href: "/about/equipment", label: "设备资源", desc: "先进仪器支撑实践", icon: "⚙️" },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="gznu-panel gznu-card-hover bg-white border border-gray-100 p-6 hover:border-primary/30 transition-all group"
            >
              <div className="text-3xl mb-3">{item.icon}</div>
              <h3 className="font-bold text-gray-900 group-hover:text-primary text-lg">{item.label}</h3>
              <p className="text-sm text-gray-500 mt-1">{item.desc}</p>
              <div className="mt-4 flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                了解更多
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </AboutPageShell>
  );
}
