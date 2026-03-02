import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import Header from "@/components/Header";
import RoleBadge from "@/components/RoleBadge";
import { mockStories } from "@/lib/mock-data";
import { ArrowLeft, Bookmark, MoreHorizontal, Eye, Minus, Plus, Sun, Moon } from "lucide-react";
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
  const story = mockStories.find((s) => s.id === id);
  const [fontSize, setFontSize] = useState(18);
  const [darkReading, setDarkReading] = useState(false);

  if (!story) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Story not found.</p>
      </div>
    );
  }

  return (
    <div className={darkReading ? "dark" : ""}>
      <div className="flex min-h-screen flex-col bg-background text-foreground">
        <Header />
        <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-8">
          {/* Nav */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> back
            </button>
            <div className="flex items-center gap-2">
              <button className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground">
                <Bookmark className="h-4 w-4" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex h-8 w-8 items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground">
                    <MoreHorizontal className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Edit</DropdownMenuItem>
                  <DropdownMenuItem>Pin to profile</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Reading mode */}
              <Popover>
                <PopoverTrigger asChild>
                  <button className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
                    <Eye className="h-4 w-4" /> reading mode
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-56" align="end">
                  <div className="space-y-4">
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Font Size</p>
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setFontSize((s) => Math.max(14, s - 2))}
                          className="flex h-8 w-8 items-center justify-center rounded border border-border transition-colors hover:bg-muted"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm">{fontSize}px</span>
                        <button
                          onClick={() => setFontSize((s) => Math.min(28, s + 2))}
                          className="flex h-8 w-8 items-center justify-center rounded border border-border transition-colors hover:bg-muted"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                    <div>
                      <p className="mb-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">Theme</p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setDarkReading(false)}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${!darkReading ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
                        >
                          <Sun className="h-3.5 w-3.5" /> Light
                        </button>
                        <button
                          onClick={() => setDarkReading(true)}
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm transition-colors ${darkReading ? "bg-foreground text-background" : "bg-muted text-muted-foreground"}`}
                        >
                          <Moon className="h-3.5 w-3.5" /> Dark
                        </button>
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Article */}
          <article className="mt-10 animate-fade-in">
            <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
              {story.title}
            </h1>
            {story.subtitle && (
              <p className="mt-2 text-lg text-muted-foreground">{story.subtitle}</p>
            )}

            <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
              <span className="font-medium text-foreground/80">{story.author.name}</span>
              <RoleBadge role={story.author.role} />
              <span>·</span>
              <span>{story.publishedAt}</span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Eye className="h-3.5 w-3.5" /> {story.views} views
              </span>
            </div>

            <div className="my-8 h-px w-12 bg-border" />

            <div
              className="prose prose-neutral max-w-none leading-relaxed"
              style={{ fontSize: `${fontSize}px` }}
              dangerouslySetInnerHTML={{ __html: story.content }}
            />
          </article>
        </main>
      </div>
    </div>
  );
};

export default StoryDetail;
