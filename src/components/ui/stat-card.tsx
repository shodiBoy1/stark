import { GlassCard } from "./glass-card";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}

export function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  return (
    <GlassCard className="p-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center">
          <Icon size={18} className={color} />
        </div>
        <div>
          <p className="text-xs text-muted uppercase tracking-wider">{label}</p>
          <p className="text-lg font-semibold text-text">{value}</p>
        </div>
      </div>
    </GlassCard>
  );
}
