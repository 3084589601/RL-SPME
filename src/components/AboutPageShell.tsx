import { AboutSubNav } from "@/components/AboutSubNav";
import { PublicPageContent } from "@/components/PublicPageContent";

export function AboutPageShell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <AboutSubNav />
      <PublicPageContent>{children}</PublicPageContent>
    </>
  );
}
