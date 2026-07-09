import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: LucideIcon;
  iconColorClass?: string;
  loading?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  subtext,
  icon: Icon,
  iconColorClass = "text-terracotta",
  loading = false,
}) => {
  if (loading) {
    return (
      <div className="animate-pulse rounded-card border border-cardborder bg-cardbg p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-3 w-1/3 rounded bg-white/10" />
          <div className="h-6 w-6 rounded-full bg-white/10" />
        </div>
        <div className="h-8 w-1/2 rounded bg-white/10" />
        <div className="h-3 w-2/3 rounded bg-white/10" />
      </div>
    );
  }

  return (
    <div className="group rounded-card border border-cardborder bg-cardbg p-5 shadow-sm hover:shadow-[var(--shadow-glow)] hover:bg-cardbg-hover transition-all duration-300">
      <div className="flex items-center justify-between gap-4">
        <span className="text-xs font-bold uppercase tracking-wider text-mutedtext">
          {label}
        </span>
        <span className={`p-1.5 rounded-lg bg-darkbg/50 border border-cardborder/40 ${iconColorClass}`}>
          <Icon size={16} />
        </span>
      </div>
      <div className="mt-3 text-3xl font-extrabold text-cream leading-tight">
        {value}
      </div>
      {subtext && (
        <p className="mt-1 text-xs text-mutedtext font-medium truncate">
          {subtext}
        </p>
      )}
    </div>
  );
};

export default StatCard;
