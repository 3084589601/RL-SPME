"use client";

import { useState } from "react";
import { AboutPageShell } from "@/components/AboutPageShell";
import { DEFAULT_LAB_INTRO } from "@/lib/lab-intro-default";
import { ChevronDown, Cpu, Eye, CircuitBoard, Box, Wifi, Brain } from "lucide-react";

const iconMap = [Cpu, Eye, CircuitBoard, Box, Wifi, Brain];

export default function ResearchPage() {
  const data = DEFAULT_LAB_INTRO;
  const [expandedIndex, setExpandedIndex] = useState<number | null>(0);

  return (
    <AboutPageShell>
      <div className="space-y-4">
        {data.research.map((item, i) => {
          const Icon = iconMap[i % iconMap.length];
          const isExpanded = expandedIndex === i;
          return (
            <div
              key={i}
              className="gznu-panel bg-white border border-gray-100 overflow-hidden cursor-pointer transition-all hover:border-primary/30"
              onClick={() => setExpandedIndex(isExpanded ? null : i)}
            >
              <div className="p-5 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <span>研究方向 {String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <h3 className="font-semibold text-gray-900 text-lg">{item}</h3>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
              </div>
              {isExpanded && (
                <div className="px-5 pb-5 pt-0">
                  <div className="bg-primary/5 rounded-lg p-4 text-sm text-gray-600">
                    <p>该方向涉及{item.split("（")[0].split("(")[0]}的核心技术与应用实践，欢迎对相关领域感兴趣的同学加入实验室深入学习与研究。</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </AboutPageShell>
  );
}
