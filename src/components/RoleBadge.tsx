import { Role, ROLE_LABELS, ROLE_KAOMOJI } from "@/lib/types";
import { cn } from "@/lib/utils";

interface RoleBadgeProps {
  role: Role;
  className?: string;
}

const roleStyles: Record<Role, string> = {
  founder: "bg-accent/15 text-accent-foreground border-accent/30",
  early_adopter: "bg-badge-early/15 text-foreground border-badge-early/30",
  contributor: "bg-badge-contributor/15 text-foreground border-badge-contributor/30",
  writer: "bg-muted text-muted-foreground border-border",
};

const RoleBadge = ({ role, className }: RoleBadgeProps) => {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium",
        roleStyles[role],
        className
      )}
    >
      {ROLE_KAOMOJI[role]} {ROLE_LABELS[role]}
    </span>
  );
};

export default RoleBadge;
