"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import { BookOpen, Library, Bot, Users } from "lucide-react";
import { HomeLatestResources, type HomeResource } from "@/components/HomeSections";
import { SectionHeader } from "@/components/SectionHeader";
import { canAccessResources } from "@/lib/permissions";

export function HomeMemberExtras() {
  const { data: session, status } = useSession();
  const canAccess = canAccessResources(session?.user?.role);
  const [resources, setResources] = useState<HomeResource[]>([]);

  useEffect(() => {
    if (!canAccess) {
      setResources([]);
      return;
    }

    let cancelled = false;
    fetch("/api/home/latest-resources")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (!cancelled && Array.isArray(data)) setResources(data);
      })
      .catch(() => {
        if (!cancelled) setResources([]);
      });

    return () => {
      cancelled = true;
    };
  }, [canAccess]);

  const quickLinks = [
    { icon: BookOpen, title: "实验室简介", href: "/about" },
    ...(canAccess ? [{ icon: Library, title: "学习资源", href: "/resources" }] : []),
    { icon: Bot, title: "作品展示", href: "/gallery" },
    { icon: Users, title: "联系我们", href: "/contact" },
  ];

  return (
    <>
      {canAccess ? <HomeLatestResources items={resources} /> : null}
      <section className="py-14 bg-white border-t border-gray-100">
        <div className="max-w-[1200px] mx-auto px-4">
          <SectionHeader title="快速入口" subtitle="Quick Links" />
          <div className={`grid grid-cols-2 gap-4 ${canAccess ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
            {(status === "loading" ? quickLinks.slice(0, 3) : quickLinks).map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex flex-col items-center gap-3 p-6 bg-white border border-gray-100 hover:border-primary hover:shadow-md transition-all group"
                >
                  <Icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-gray-700 group-hover:text-primary">{item.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}