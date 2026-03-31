import { Story } from "@/lib/types";
import RoleBadge from "./RoleBadge";
import VerifiedBadge from "./VerifiedBadge";
import { Eye, EyeOff, Pin } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface StoryCardProps {
  story: Story;
  showPinned?: boolean;
}

const StoryCard = ({ story, showPinned }: StoryCardProps) => {
  const date = story.published_at ? format(new Date(story.published_at), "MMM d") : "";
  const isInnerCircleOnly = story.visibility === "inner_circle";

  return (
    <article className="py-8">
      {showPinned && story.is_pinned && (
        <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-muted-foreground">
          <Pin className="h-3 w-3" /> pinned
        </div>
      )}
      <Link to={`/story/${story.id}`} className="group block">
        <h2 className="font-serif text-xl font-medium tracking-tight text-foreground transition-colors group-hover:text-muted-foreground md:text-2xl">
          {story.title}
        </h2>
        {story.subtitle && (
          <p className="mt-1 text-sm text-muted-foreground">{story.subtitle}</p>
        )}
      </Link>
      <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
        {story.author && (
          <>
            <Link
              to={`/@${story.author.username}`}
              className="text-foreground/70 hover:text-foreground transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {story.author.display_name}
            </Link>
            {isInnerCircleOnly && <VerifiedBadge size="sm" />}
            <RoleBadge role={story.author.role} variant="card" />
            <span>·</span>
          </>
        )}
        <span>{date}</span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" /> {story.views}
        </span>
        {story.is_hidden && (
          <span className="flex items-center gap-1 text-muted-foreground/60">
            <span>·</span>
            <EyeOff className="h-3 w-3" /> hidden
          </span>
        )}
      </div>
    </article>
  );
};

export default StoryCard;
