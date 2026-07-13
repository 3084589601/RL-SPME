"use client";

import { useState } from "react";
import { AboutPageShell } from "@/components/AboutPageShell";
import { DEFAULT_LAB_INTRO } from "@/lib/lab-intro-default";
import { ChevronDown, Trophy, Calendar, Award } from "lucide-react";

export default function CompetitionsPage() {
  const data = DEFAULT_LAB_INTRO;
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  return (
    <AboutPageShell>
      <div className="space-y-4">
        {data.competitions.map((item, i) => {
          const isExpanded = expandedIndex === i;
          return (
            <article
              key={i}
              className="gznu-panel bg-white border border-gray-100 overflow-hidden cursor-pointer transition-all hover:border-primary/30"
              onClick={() => setExpandedIndex(isExpanded ? null : i)}
            >
              <div className="p-5 md:p-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-amber-100">
                    <Trophy className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-900">{item.name}</h3>
                      <div className="flex flex-wrap gap-2">
                        {item.level ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full border border-amber-100">
                            <Award className="w-3 h-3" />
                            {item.level}
                          </span>
                        ) : null}
                        {item.period ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2.5 py-1 bg-gray-50 text-gray-600 rounded-full border border-gray-100">
                            <Calendar className="w-3 h-3" />
                            {item.period}
                          </span>
                        ) : null}
                      </div>
                    </div>
                    {item.description ? (
                      <p className="text-gray-600 leading-relaxed">{item.description}</p>
                    ) : null}
                  </div>
                  <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 mt-1 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                </div>
              </div>
              {isExpanded && (
                <div className="px-5 md:px-6 pb-5 md:pb-6 pt-0">
                  <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-4 border border-primary/10">
                    <div className="flex items-center gap-2 text-primary text-sm font-medium mb-2">
                      <Trophy className="w-4 h-4" />
                      竞赛成就
                    </div>
                    <p className="text-gray-600 text-sm">该竞赛每年举办一届，实验室已连续参与多年，积累了丰富的参赛经验和成果。</p>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </AboutPageShell>
  );
}
