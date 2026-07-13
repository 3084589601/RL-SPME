import Link from "next/link";
import { SimplePageLayout, GznuPanel } from "@/components/InnerPageLayout";
import { getCachedLabIntro } from "@/lib/cached-data";
import { Mail, MapPin, Phone, Clock, Users, ChevronRight } from "lucide-react";

export const revalidate = 300;

export default async function ContactPage() {
  const data = await getCachedLabIntro();
  const { contactInfo, recruitment } = data;

  const contacts = [
    {
      icon: MapPin,
      label: "地址",
      value: contactInfo.address,
      href: undefined as string | undefined,
    },
    {
      icon: Mail,
      label: "邮箱",
      value: contactInfo.email,
      href: `mailto:${contactInfo.email}`,
    },
    {
      icon: Phone,
      label: "电话",
      value: contactInfo.phone,
      href: contactInfo.phone.startsWith("0") ? `tel:${contactInfo.phone}` : undefined,
    },
  ];

  return (
    <SimplePageLayout>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {contacts.map((item) => {
            const Icon = item.icon;
            const inner = (
              <div className="gznu-panel bg-white border border-gray-100 p-5 h-full hover:border-primary/25 transition-colors">
                <div className="w-11 h-11 bg-primary/10 flex items-center justify-center mb-4">
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className="text-gray-900 font-medium leading-relaxed text-sm md:text-base">{item.value}</p>
              </div>
            );
            return item.href ? (
              <a key={item.label} href={item.href} className="block group">
                {inner}
              </a>
            ) : (
              <div key={item.label}>{inner}</div>
            );
          })}
        </div>

        {contactInfo.hours ? (
          <GznuPanel className="px-5 py-4 flex items-center gap-3 text-sm text-gray-600">
            <Clock className="w-5 h-5 text-primary shrink-0" />
            <span>
              <span className="text-gray-500">开放时间：</span>
              {contactInfo.hours}
            </span>
          </GznuPanel>
        ) : null}

        <GznuPanel className="overflow-hidden">
          <div className="bg-primary px-5 py-4 flex items-center gap-3 text-white">
            <Users className="w-6 h-6 shrink-0" />
            <h2 className="font-bold text-lg">成员招新</h2>
          </div>
          <div className="p-5 md:p-6 space-y-5">
            <p className="text-gray-700 leading-relaxed">{recruitment.intro}</p>

            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-primary rounded-sm" />
                招新要求
              </h3>
              <ul className="space-y-2">
                {recruitment.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                    <span className="w-5 h-5 bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    {req}
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <p className="text-sm text-gray-600 leading-relaxed flex-1">{recruitment.applyNote}</p>
              <div className="flex flex-wrap gap-3 shrink-0">
                <a
                  href={`mailto:${contactInfo.email}?subject=机器人实验室成员招新申请`}
                  className="inline-flex items-center gap-1 px-4 py-2 bg-primary text-white text-sm hover:bg-primary-dark transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  邮件申请
                </a>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-1 px-4 py-2 border border-primary text-primary text-sm hover:bg-primary/5 transition-colors"
                >
                  成员登录
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </GznuPanel>
      </div>
    </SimplePageLayout>
  );
}
