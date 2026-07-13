"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Mail, MapPin, Clock } from "lucide-react";
import { aboutSubNav } from "@/lib/nav";
import { canAccessResources } from "@/lib/permissions";
import { FastImg } from "@/components/FastImg";

export function Footer({ logoUrl }: { logoUrl?: string | null }) {
  const { data: session } = useSession();
  const canAccess = canAccessResources(session?.user?.role);

  return (
    <footer className="bg-surface-dark text-blue-200/70 mt-auto">
      <div className="max-w-[1200px] mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              {logoUrl ? (
                <div className="w-10 h-10 rounded bg-white p-0.5 overflow-hidden shrink-0 shadow-sm">
                  <FastImg src={logoUrl} alt="LOGO" priority className="object-contain w-full h-full" />
                </div>
              ) : null}
              <h3 className="text-white font-bold">机器人实验室</h3>
            </div>
            <p className="text-sm leading-relaxed mb-4">
              贵州民族大学物理与机电工程学院机器人实验室
            </p>
            <Link href="/contact" className="text-sm text-primary-light hover:text-white transition-colors">
              查看联系方式 →
            </Link>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">实验室概况</h4>
            <ul className="space-y-2 text-sm">
              {aboutSubNav.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">展示与成员</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/certificates" className="hover:text-white transition-colors">荣誉证书</Link></li>
              <li><Link href="/gallery" className="hover:text-white transition-colors">作品展示</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">联系我们</Link></li>
              {canAccess ? (
                <>
                  <li><Link href="/resources" className="hover:text-white transition-colors">学习资源</Link></li>
                  <li><Link href="/profile" className="hover:text-white transition-colors">个人中心</Link></li>
                </>
              ) : (
                <li><Link href="/login" className="hover:text-white transition-colors">成员登录</Link></li>
              )}
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-3 text-sm">联系信息</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-primary-light shrink-0 mt-0.5" />
                贵州民族大学物理与机电工程学院
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-primary-light shrink-0" />
                robotics@gzmu.edu.cn
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary-light shrink-0" />
                周一至周五 9:00-21:00
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary/20 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-blue-300/40">
          <span>© {new Date().getFullYear()} 贵州民族大学物理与机电工程学院机器人实验室</span>
          <span>机器人实验室管理系统</span>
        </div>
      </div>
    </footer>
  );
}
