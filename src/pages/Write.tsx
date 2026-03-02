import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, Smile, ImageIcon } from "lucide-react";

const Write = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const [wordCount, setWordCount] = useState(0);

  const updateWordCount = useCallback(() => {
    const text = contentRef.current?.innerText || "";
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    setWordCount(words);
  }, []);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    contentRef.current?.focus();
  };

  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> back
          </button>
          <div className="flex items-center gap-4">
            <span className="text-xs text-muted-foreground">
              {wordCount} words · {readTime} min
            </span>
            <button className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
              <Eye className="h-4 w-4" /> preview
            </button>
            <button className="rounded-lg bg-muted px-4 py-1.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary">
              Publish
            </button>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent font-serif text-4xl font-semibold tracking-tight placeholder:text-muted-foreground/40 focus:outline-none"
        />
        <input
          type="text"
          placeholder="Add a subtitle..."
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="mt-3 w-full bg-transparent text-lg placeholder:text-muted-foreground/40 focus:outline-none"
        />

        <div className="my-6 h-px w-12 bg-border" />

        {/* Toolbar */}
        <div className="mb-4 flex items-center gap-3 text-muted-foreground">
          <button
            onClick={() => execCommand("bold")}
            className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:text-foreground"
            title="Bold"
          >
            <span className="text-sm font-bold">B</span>
          </button>
          <button
            onClick={() => execCommand("italic")}
            className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:text-foreground"
            title="Italic"
          >
            <span className="text-sm italic">I</span>
          </button>
          <button
            onClick={() => execCommand("underline")}
            className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:text-foreground"
            title="Underline"
          >
            <span className="text-sm underline">U</span>
          </button>
          <div className="h-4 w-px bg-border" />
          <button className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:text-foreground">
            <Smile className="h-4 w-4" />
          </button>
          <button className="flex h-8 w-8 items-center justify-center rounded transition-colors hover:text-foreground">
            <ImageIcon className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground/60">image goes to end of text</span>
        </div>

        {/* Content editable */}
        <div
          ref={contentRef}
          contentEditable
          onInput={updateWordCount}
          data-placeholder="Begin writing..."
          className="min-h-[300px] text-lg leading-relaxed focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40"
        />
      </main>
    </div>
  );
};

export default Write;
