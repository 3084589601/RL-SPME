import type { Metadata } from "next";
import { Providers } from "@/components/Providers";
import { SiteHeader } from "@/components/SiteHeader";
import { Footer } from "@/components/Footer";
import { BackToTop } from "@/components/BackToTop";
import { ImagePreloads } from "@/components/ImagePreloads";
import { HomeBodyClass } from "@/components/HomeBodyClass";
import manifest from "@/generated/media-manifest.json";
import { toDisplayUrl } from "@/lib/media-url";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "贵州民族大学物理与机电工程学院机器人实验室",
    template: "%s | 贵州民族大学机器人实验室",
  },
  description:
    "贵州民族大学物理与机电工程学院机器人实验室官方网站。提供嵌入式开发、视觉算法、PCB设计、SolidWorks建模、AI大模型等学习资源，展示RoboMaster、电子设计竞赛等比赛成果，支持在线学习追踪与成员管理。",
  keywords: [
    "贵州民族大学", "物理与机电工程学院", "机器人实验室", "嵌入式开发", "视觉算法",
    "RoboMaster", "机甲大师", "电子设计竞赛", "智能机器人", "PCB设计",
    "SolidWorks", "AI大模型", "实验室管理", "学习资源", "竞赛成果",
  ],
  authors: [{ name: "贵州民族大学物理与机电工程学院机器人实验室" }],
  creator: "贵州民族大学机器人实验室",
  publisher: "贵州民族大学物理与机电工程学院",
  formatDetection: { telephone: false },
  openGraph: {
    type: "website",
    locale: "zh_CN",
    siteName: "贵州民族大学机器人实验室",
    title: "贵州民族大学物理与机电工程学院机器人实验室",
    description:
      "嵌入式开发、视觉算法、RoboMaster竞赛、学习资源与成员管理——贵州民族大学机器人实验室官方网站。",
    url: "https://gzmu-robot-lab.trycloudflare.com",
  },
  robots: {
    index: true,
    follow: true,
    "max-snippet": -1,
    "max-image-preview": "large",
    "max-video-preview": -1,
  },
  other: {
    "baidu-site-verification": "codeva-请替换为真实验证码",
    "baidu_union_verify": "请替换为真实百度验证码",
    "google-site-verification": "请替换为真实Google验证码",
    "msvalidate.01": "请替换为真实Bing验证码",
  },
};

export const revalidate = 300;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const logoUrlCutout = manifest.logoCutout;
  const logoUrlWhite = manifest.logoWhite;

  const logoPreloads = [logoUrlCutout, logoUrlWhite]
    .filter((u): u is string => Boolean(u))
    .map((u) => toDisplayUrl(u));

  return (
    <html lang="zh-CN">
      <head>
        <ImagePreloads urls={logoPreloads} />
      </head>
      <body className="flex flex-col min-h-screen">
        <a href="#main-content" className="skip-to-content">
          跳到主要内容
        </a>
        <Providers>
          <HomeBodyClass />
          <SiteHeader logoUrl={logoUrlCutout} />
          <main id="main-content" className="flex-1">{children}</main>
          <Footer logoUrl={logoUrlWhite} />
          <BackToTop />
        </Providers>
      </body>
    </html>
  );
}
