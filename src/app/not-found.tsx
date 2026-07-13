import Link from "next/link";
import { FileQuestion, Home, BookOpen } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-[#f5f7fa] px-4">
      <div className="text-center max-w-md animate-fade-in-up">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
          <FileQuestion className="w-10 h-10 text-primary" />
        </div>
        <h1 className="text-5xl font-extrabold text-primary mb-3">404</h1>
        <h2 className="text-xl font-bold text-gray-900 mb-3">页面不存在</h2>
        <p className="text-gray-500 text-sm leading-relaxed mb-8">
          您访问的页面可能已被移除、地址输入有误，或暂时不可用。
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-dark transition-colors shadow-sm shadow-primary/20"
          >
            <Home className="w-4 h-4" />
            返回首页
          </Link>
          <Link
            href="/resources"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 border border-primary text-primary text-sm font-medium rounded-lg hover:bg-primary hover:text-white transition-colors"
          >
            <BookOpen className="w-4 h-4" />
            学习资源
          </Link>
        </div>
      </div>
    </div>
  );
}
