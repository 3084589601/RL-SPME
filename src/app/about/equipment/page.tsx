"use client";

import { useState } from "react";
import { AboutPageShell } from "@/components/AboutPageShell";
import { DEFAULT_LAB_INTRO } from "@/lib/lab-intro-default";
import { Cpu, Monitor, Eye, Printer, Wrench, CircuitBoard, ChevronDown } from "lucide-react";

const iconMap = [Cpu, Monitor, Eye, Printer, Wrench, CircuitBoard];

export default function EquipmentPage() {
  const data = DEFAULT_LAB_INTRO;
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  return (
    <AboutPageShell>
      <div className="space-y-4">
        {data.equipment.map((item, i) => {
          const Icon = iconMap[i % iconMap.length];
          const isSelected = selectedIndex === i;
          return (
            <div
              key={i}
              className={`gznu-panel bg-white border overflow-hidden cursor-pointer transition-all ${
                isSelected ? "border-primary/50 shadow-md" : "border-gray-100 hover:border-primary/30"
              }`}
              onClick={() => setSelectedIndex(isSelected ? null : i)}
            >
              <div className="p-5 flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? "bg-primary text-white" : "bg-primary/10 text-primary"
                }`}>
                  <Icon className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-400 mb-1">设备 {String(i + 1).padStart(2, "0")}</div>
                  <p className="text-gray-700 leading-relaxed font-medium">{item}</p>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${isSelected ? "rotate-180" : ""}`} />
              </div>
              {isSelected && (
                <div className="px-5 pb-5 pt-0">
                  <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-md p-2 text-center">
                        <div className="text-xs text-gray-400">数量</div>
                        <div className="font-medium text-gray-700">充足</div>
                      </div>
                      <div className="bg-white rounded-md p-2 text-center">
                        <div className="text-xs text-gray-400">状态</div>
                        <div className="font-medium text-green-600">可用</div>
                      </div>
                    </div>
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
