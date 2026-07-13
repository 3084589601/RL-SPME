import { LucideIcon } from "lucide-react";

export function PageHero({
  title,
  subtitle,
  icon: Icon,
}: {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
}) {
  return (
    <section className="gradient-hero text-white py-14 md:py-16">
      <div className="max-w-[1200px] mx-auto px-4">
        <div className="flex items-center gap-3 mb-3">
          {Icon ? <Icon className="w-9 h-9 md:w-10 md:h-10 shrink-0" /> : null}
          <h1 className="text-3xl md:text-4xl font-bold">{title}</h1>
        </div>
        {subtitle ? <p className="text-blue-100 text-base md:text-lg max-w-2xl">{subtitle}</p> : null}
      </div>
    </section>
  );
}
