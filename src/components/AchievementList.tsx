import { ACHIEVEMENTS, getUnlockedAchievements, type UserStats } from "@/lib/achievements";
import { cn } from "@/lib/utils";

interface AchievementListProps {
  stats: UserStats;
}

const AchievementList = ({ stats }: AchievementListProps) => {
  const unlocked = getUnlockedAchievements(stats);
  const unlockedIds = new Set(unlocked.map((a) => a.id));

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {ACHIEVEMENTS.map((achievement) => {
        const isUnlocked = unlockedIds.has(achievement.id);
        return (
          <div
            key={achievement.id}
            className={cn(
              "flex items-start gap-3 rounded-lg border p-3 transition-colors",
              isUnlocked
                ? "border-border bg-card"
                : "border-border/50 bg-muted/30 opacity-50"
            )}
          >
            <span className="mt-0.5 text-lg leading-none">{achievement.kaomoji}</span>
            <div className="min-w-0 flex-1">
              <p className={cn("text-sm font-medium", !isUnlocked && "text-muted-foreground")}>
                {achievement.title}
              </p>
              <p className="text-xs text-muted-foreground">{achievement.description}</p>
            </div>
            {isUnlocked && (
              <span className="flex-shrink-0 text-[10px] font-medium text-muted-foreground">✓</span>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default AchievementList;
