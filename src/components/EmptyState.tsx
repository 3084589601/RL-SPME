import { type ReactNode } from "react";
import { FileQuestion, FolderOpen, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_ICONS: Record<string, LucideIcon> = {
  empty: FileQuestion,
  noResults: FolderOpen,
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  iconVariant = "empty",
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  iconVariant?: "empty" | "noResults";
}) {
  const IconComponent = Icon || DEFAULT_ICONS[iconVariant] || FileQuestion;

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
        <IconComponent className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="mb-1 text-base font-semibold text-gray-700">{title}</h3>
      {description ? (
        <p className="mb-6 max-w-sm text-sm text-gray-500">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
