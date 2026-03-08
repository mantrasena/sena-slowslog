import { useParams, useNavigate, Link } from "react-router-dom";
import { useState } from "react";
import Header from "@/components/Header";
import RoleBadge from "@/components/RoleBadge";
import { useStory, useDeleteStory, useTogglePin } from "@/hooks/useStories";
import { useAuth } from "@/hooks/useAuth";
import { useBookmarks, useToggleBookmark } from "@/hooks/useBookmarks";
import { useRecordView } from "@/hooks/useRecordView";
import { ArrowLeft, Bookmark, BookmarkCheck, MoreHorizontal, Eye, Minus, Plus, Sun, Moon, Pencil, Pin, Trash2, HandMetal } from "lucide-react";
import { useHighFiveCount, useHasHighFived, useToggleHighFive } from "@/hooks/useHighFives";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const StoryDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: story, isLoading } = useStory(id);
  const { user } = useAuth();
  const deleteMutation = useDeleteStory();
  const pinMutation = useTogglePin();
  const { data: bookmarks } = useBookmarks();
  const bookmarkMutation = useToggleBookmark();
  const { data: highFiveCount } = useHighFiveCount(id);
  const { data: hasHighFived } = useHasHighFived(id);
  const highFiveMutation = useToggleHighFive();
  const [fontSize, setFontSize] = useState(18);
  const [darkReading, setDarkReading] = useState(false);

  useRecordView(id);

  const isBookmarked = bookmarks?.includes(id || "") ?? false;

  if (isLoading) return <div className="flex min-h-screen items-center justify-center"><p className="text-sm text-muted-foreground">loading...</p></div>;
  if (!story) return <div className="flex min-h-screen items-center justify-center"><p className="text-sm text-muted-foreground">story not found (╥﹏╥)</p></div>;

  const isOwner = user?.id === story.user_id;
  const date = story.published_at ? format(new Date(story.published_at), "MMM d, yyyy") : "";

  const handleDelete = async () => {
    await deleteMutation.mutateAsync(story.id);
    toast.success("deleted (T_T)");
    navigate("/");
  };

  const handlePin = async () => {
    await pinMutation.mutateAsync({ id: story.id, pinned: !story.is_pinned });
    toast.success(story.is_pinned ? "unpinned" : "pinned (◕‿◕)");
  };

  return (
    <div className={darkReading ? "dark" : ""}>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Header />
        <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="inline h-4 w-4" /> back
            </button>
            <div className="flex items-center gap-2">
              {user && (
                <button
                  onClick={() => bookmarkMutation.mutate({ storyId: story.id, bookmarked: isBookmarked })}
                  className="h-8 w-8 rounded text-muted-foreground hover:text-foreground flex items-center justify-center"
                  title={isBookmarked ? "Remove bookmark" : "Bookmark"}
                >
                  {isBookmarked ? <BookmarkCheck className="h-4 w-4 text-foreground" /> : <Bookmark className="h-4 w-4" />}
                </button>
              )}
              {isOwner && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="h-8 w-8 rounded text-muted-foreground hover:text-foreground flex items-center justify-center">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate(`/write?edit=${story.id}`)} className="gap-2 cursor-pointer">
                      <Pencil className="h-4 w-4" /> Edit article
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handlePin} className="gap-2 cursor-pointer">
                      <Pin className="h-4 w-4" /> {story.is_pinned ? "Unpin from profile" : "Pin to profile"}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleDelete} className="gap-2 cursor-pointer text-destructive">
                      <Trash2 className="h-4 w-4" /> Delete article
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              <Popover>
                <PopoverTrigger asChild>
                  <button className="text-xs text-muted-foreground hover:text-foreground">
                    <Eye className="inline h-3.5 w-3.5" /> reading mode
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-52" align="end">
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">size</p>
                      <div className="flex items-center justify-between">
                        <button onClick={() => setFontSize((s) => Math.max(14, s - 2))} className="h-7 w-7 rounded border border-border text-xs hover:bg-muted flex items-center justify-center">
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-xs">{fontSize}px</span>
                        <button onClick={() => setFontSize((s) => Math.min(28, s + 2))} className="h-7 w-7 rounded border border-border text-xs hover:bg-muted flex items-center justify-center">
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">theme</p>
                      <div className="flex gap-2">
                        <button onClick={() => setDarkReading(false)} className={`flex-1 rounded-md px-3 py-1.5 text-xs ${!darkReading ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                          <Sun className="inline h-3 w-3" /> light
                        </button>
                        <button onClick={() => setDarkReading(true)} className={`flex-1 rounded-md px-3 py-1.5 text-xs ${darkReading ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}>
                          <Moon className="inline h-3 w-3" /> dark
                        </button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <article className="mt-10">
            <h1 className="font-serif text-3xl font-medium tracking-tight">{story.title}</h1>
            {story.subtitle && <p className="mt-2 text-muted-foreground">{story.subtitle}</p>}

            <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
              {story.author && (
                <>
                  <Link to={`/profile/${story.author.username}`} className="text-foreground/70 hover:text-foreground transition-colors">{story.author.display_name}</Link>
                  <RoleBadge role={story.author.role} />
                  <span>·</span>
                </>
              )}
              <span>{date}</span>
              <span>·</span>
              <span><Eye className="inline h-3 w-3" /> {story.views}</span>
            </div>

            <div className="my-8 h-px w-12 bg-border" />

            <div
              className="prose prose-neutral max-w-none leading-relaxed text-muted-foreground [&_*]:!bg-transparent [&_*]:!text-inherit [&_span]:!text-inherit [&_div]:!text-inherit [&_p]:!text-inherit [&_*]:!font-[inherit]"
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ __html: story.content?.replace(/style="[^"]*"/gi, '') || "" }}
            />
          </article>
        </main>
      </div>
    </div>
  );
};

export default StoryDetail;
