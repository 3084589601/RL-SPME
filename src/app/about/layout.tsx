export const revalidate = 300;

export default function AboutLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-[#f5f7fa] min-h-screen">{children}</div>;
}
