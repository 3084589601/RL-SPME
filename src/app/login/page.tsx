"use client";

import { useEffect, useState } from "react";
import { signIn, useSession } from "next-auth/react";
import { LogIn, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PageHero } from "@/components/PageHero";
import { GznuBreadcrumb } from "@/components/GznuBreadcrumb";
import { GznuPanel } from "@/components/InnerPageLayout";
import { GznuSectionHead } from "@/components/GznuSectionHead";

export default function LoginPage() {
  const { status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      window.location.replace("/");
    }
  }, [status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error || result?.ok === false) {
        setError("用户名或密码错误");
        return;
      }

      window.location.replace("/");
    } finally {
      setLoading(false);
    }
  }

  if (status === "authenticated") {
    return (
      <div className="bg-[#f5f7fa] min-h-screen flex items-center justify-center text-sm text-gray-500">
        正在跳转到首页...
      </div>
    );
  }

  return (
    <div className="bg-[#f5f7fa] min-h-screen">
      <PageHero
        title="成员登录"
        subtitle="贵州民族大学物理与机电工程学院 · 机器人实验室"
        icon={LogIn}
      />
      <GznuBreadcrumb items={[{ label: "成员登录" }]} />

      <div className="max-w-[1200px] mx-auto px-4 py-10 md:py-12">
        <div className="max-w-md mx-auto">
          <GznuPanel>
            <GznuSectionHead title="账号登录" />
            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 text-red-600 text-sm border border-red-100">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">用户名</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 text-sm focus-visible:outline-none focus:border-primary bg-white"
                  placeholder="请输入用户名"
                  required
                  autoComplete="username"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">密码</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 border border-gray-200 text-sm focus-visible:outline-none focus:border-primary bg-white"
                  placeholder="请输入密码"
                  required
                  autoComplete="current-password"
                />
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                <LogIn className="w-4 h-4" />
                登录
              </Button>
            </form>

          </GznuPanel>
        </div>
      </div>
    </div>
  );
}
