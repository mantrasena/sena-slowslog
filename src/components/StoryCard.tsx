import { Story } from "@/lib/types";
import RoleBadge from "./RoleBadge";
import { Eye, Pin } from "lucide-react";
import { Link } from "react-router-dom";

interface StoryCardProps {
  story: Story;
  showPinned?: boolean;
}

const StoryCard = ({ story, showPinned }: StoryCardProps) => {
  return (
    <article className="animate-fade-in py-10">
      {showPinned && story.pinned && (
        <div className="mb-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Pin className="h-3 w-3" /> Pinned
        </div>
      )}
      <Link to={`/story/${story.id}`} className="group block">
        <h2 className="font-serif text-2xl font-semibold tracking-tight text-foreground transition-colors group-hover:text-foreground/80 md:text-3xl">
          {story.title}
        </h2>
        {story.subtitle && (
          <p className="mt-1.5 text-muted-foreground">{story.subtitle}</p>
        )}
      </Link>
      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <span className="font-medium text-foreground/80">{story.author.name}</span>
        <RoleBadge role={story.author.role} />
        <span>·</span>
        <span>{story.publishedAt}</span>
        <span>·</span>
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" /> {story.views}
        </span>
      </div>
    </article>
  );
};

export default StoryCard;
