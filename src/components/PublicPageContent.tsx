export function PublicPageContent({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[1200px] mx-auto px-4 pt-3 pb-8 md:pt-4 md:pb-10">
      {children}
    </div>
  );
}
