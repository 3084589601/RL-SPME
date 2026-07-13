"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[App Error]", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#f5f7fa] px-4">
      <div className="text-center max-w-md animate-fade-in-up">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-amber-50 flex items-center justify-center border border-amber-100">
          <AlertTriangle className="w-10 h-10 text-amber-500" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">页面出错了</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-2">
          页面加载时发生了意外错误，您可以尝试重新加载。
        </p>
        {error.digest && (
          <p className="text-xs text-gray-400 mb-6">
            错误追踪 ID：{error.digest}
          </p>
        )}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            type="button"
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
          >
            <RefreshCw className="w-4 h-4" />
            重新加载
          </button>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Home className="w-4 h-4" />
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
