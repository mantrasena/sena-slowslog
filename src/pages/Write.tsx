import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Eye, ImageIcon, Loader2, Strikethrough, List } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useSaveStory, useStory } from "@/hooks/useStories";
import { usePublishCooldown } from "@/hooks/usePublishCooldown";
import { useEditorImages } from "@/hooks/useEditorImages";
import EditorImageOverlay from "@/components/EditorImageOverlay";
import { compressImage } from "@/lib/image-compress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import KaomojiPicker from "@/components/KaomojiPicker";

const AUTO_SAVE_INTERVAL = 30_000; // 30 seconds

const Write = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const { user, isFounder, isAdmin } = useAuth();
  const saveMutation = useSaveStory();
  const { data: existingStory } = useStory(editId || undefined);
  const { data: cooldown } = usePublishCooldown();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);
  const [wordCount, setWordCount] = useState(0);
  const [preview, setPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");
  const currentIdRef = useRef<string | null>(editId);
  const { activeImg, hoveredImg, removeImage, clearStates, overlayRef } = useEditorImages(contentRef);

  useEffect(() => {
    if (existingStory && contentRef.current) {
      setTitle(existingStory.title);
      setSubtitle(existingStory.subtitle || "");
      contentRef.current.innerHTML = existingStory.content || "";
      updateWordCount();
      // Track initial content to avoid unnecessary saves
      lastSavedRef.current = JSON.stringify({
        title: existingStory.title,
        subtitle: existingStory.subtitle || "",
        content: existingStory.content || "",
      });
    }
  }, [existingStory]);

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user]);

  // Sync currentIdRef when editId changes
  useEffect(() => {
    if (editId) currentIdRef.current = editId;
  }, [editId]);

  const autoSaveDraft = useCallback(async () => {
    if (!user || !contentRef.current) return;
    const content = contentRef.current.innerHTML || "";
    if (!title.trim() && !content.trim()) return;

    const current = JSON.stringify({ title, subtitle, content });
    if (current === lastSavedRef.current) return; // No changes

    // If editing a published story, keep it published (don't revert to draft)
    const keepPublished = !!editId && existingStory && !existingStory.is_draft;

    setAutoSaveStatus("saving");
    try {
      const result = await saveMutation.mutateAsync({
        id: currentIdRef.current || undefined,
        title: title || "untitled",
        subtitle,
        content,
        is_draft: keepPublished ? false : true,
      });
      // Track the saved ID so subsequent auto-saves update instead of insert
      if (result?.id && !currentIdRef.current) {
        currentIdRef.current = result.id;
        window.history.replaceState(null, "", `/write?edit=${result.id}`);
      }
      lastSavedRef.current = current;
      setAutoSaveStatus("saved");
      setTimeout(() => setAutoSaveStatus("idle"), 2000);
    } catch {
      setAutoSaveStatus("idle");
    }
  }, [title, subtitle, user, saveMutation, editId, existingStory]);

  // Auto-save as draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      autoSaveDraft();
    }, AUTO_SAVE_INTERVAL);
    return () => clearInterval(interval);
  }, [autoSaveDraft]);

  const updateWordCount = useCallback(() => {
    const text = contentRef.current?.innerText || "";
    setWordCount(text.trim().split(/\s+/).filter(Boolean).length);
  }, []);

  const execCommand = (command: string) => {
    document.execCommand(command, false);
    contentRef.current?.focus();
  };

  const bypassCooldown = isFounder || isAdmin;
  const isEditingPublished = !!editId && existingStory && !existingStory.is_draft;
  const canPublish = bypassCooldown || isEditingPublished || cooldown?.canPublish !== false;

  const publishLabel = () => {
    if (bypassCooldown || isEditingPublished || !cooldown || cooldown.canPublish) return "publish";
    if (cooldown.daysLeft > 0) return `${cooldown.daysLeft}d ${cooldown.hoursLeft}h`;
    return `${cooldown.hoursLeft}h`;
  };

  const handleSave = async (isDraft: boolean) => {
    const content = contentRef.current?.innerHTML || "";
    if (!title.trim()) {
      toast.error("title is required");
      return;
    }
    if (!isDraft && !canPublish) {
      toast.error(`you can publish again in ${cooldown?.daysLeft}d ${cooldown?.hoursLeft}h (◞‸◟)`);
      return;
    }
    try {
      const result = await saveMutation.mutateAsync({
        id: currentIdRef.current || editId || undefined,
        title,
        subtitle,
        content,
        is_draft: isDraft,
      });
      if (result?.id) currentIdRef.current = result.id;
      lastSavedRef.current = JSON.stringify({ title, subtitle, content });
      toast.success(isDraft ? "draft saved (◕‿◕)" : "published! (ﾉ◕ヮ◕)ﾉ*:・ﾟ✧");
      navigate(isDraft ? "/settings" : "/");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const insertKaomoji = (k: string) => {
    contentRef.current?.focus();
    document.execCommand("insertText", false, k);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (!file.type.startsWith("image/")) {
      toast.error("only image files are allowed");
      return;
    }

    setUploading(true);
    try {
      const compressed = await compressImage(file, { quality: 0.9, format: "image/jpeg" });
      const ext = "jpg";
      const path = `${user.id}/${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("story-images")
        .upload(path, compressed, { contentType: "image/jpeg" });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("story-images")
        .getPublicUrl(path);

      contentRef.current?.focus();
      document.execCommand(
        "insertHTML",
        false,
        `<img src="${urlData.publicUrl}" alt="story image" style="max-width:100%;border-radius:8px;margin:1rem 0" />`
      );
      updateWordCount();
      toast.success("image uploaded (◕‿◕)");
    } catch (err: any) {
      toast.error(err.message || "upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const readTime = Math.max(1, Math.ceil(wordCount / 200));

  if (preview) {
    return (
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
            <button onClick={() => { setPreview(false); requestAnimationFrame(() => { if (contentRef.current) contentRef.current.innerHTML = previewHtml; }); }} className="text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="inline h-4 w-4" /> edit
            </button>
            <span className="text-xs text-muted-foreground">preview</span>
          </div>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
          <h1 className="font-serif text-3xl font-medium tracking-tight">{title || "untitled"}</h1>
          {subtitle && <p className="mt-2 text-muted-foreground">{subtitle}</p>}
          <div className="my-6 h-px w-12 bg-border" />
          <div
            className="prose prose-neutral max-w-none text-lg leading-relaxed"
            dangerouslySetInnerHTML={{ __html: previewHtml }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-3">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> back
          </button>
          <div className="flex items-center gap-3">
            <span className="text-[10px] text-muted-foreground">
              {autoSaveStatus === "saving" ? "saving..." : autoSaveStatus === "saved" ? "saved ✓" : `${wordCount} words · ${readTime} min`}
            </span>
            <button
              onClick={() => { setPreviewHtml(contentRef.current?.innerHTML || ""); setPreview(true); }}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              <Eye className="inline h-3.5 w-3.5" /> preview
            </button>
            <button
              onClick={() => handleSave(true)}
              disabled={saveMutation.isPending}
              className="rounded-md bg-muted px-3 py-1 text-xs text-muted-foreground hover:bg-secondary"
            >
              draft
            </button>
            <button
              onClick={() => handleSave(false)}
              disabled={saveMutation.isPending || !canPublish}
              className="rounded-md bg-foreground px-3 py-1 text-xs text-background hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!canPublish ? `you can publish again in ${cooldown?.daysLeft}d ${cooldown?.hoursLeft}h` : ""}
            >
              {publishLabel()}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <input
          type="text"
          placeholder="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full bg-transparent font-serif text-3xl font-medium tracking-tight placeholder:text-muted-foreground/30 focus:outline-none"
        />
        <input
          type="text"
          placeholder="subtitle..."
          value={subtitle}
          onChange={(e) => setSubtitle(e.target.value)}
          className="mt-2 w-full bg-transparent text-sm text-muted-foreground placeholder:text-muted-foreground/30 focus:outline-none"
        />

        <div className="my-6 h-px w-12 bg-border" />

        <div className="mb-4 flex items-center gap-2 text-muted-foreground">
          <button onClick={() => execCommand("bold")} className="h-7 w-7 rounded text-xs font-bold hover:text-foreground" title="Bold">B</button>
          <button onClick={() => execCommand("italic")} className="h-7 w-7 rounded text-xs italic hover:text-foreground" title="Italic">I</button>
          <button onClick={() => execCommand("underline")} className="h-7 w-7 rounded text-xs underline hover:text-foreground" title="Underline">U</button>
          <div className="h-4 w-px bg-border" />
          <KaomojiPicker onSelect={insertKaomoji}>
            <button className="h-7 rounded px-2 text-[10px] hover:text-foreground">(◕‿◕)</button>
          </KaomojiPicker>
          <div className="h-4 w-px bg-border" />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="h-7 w-7 rounded hover:text-foreground flex items-center justify-center"
            title="Insert image"
          >
            {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImageIcon className="h-3.5 w-3.5" />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>

        <div
          ref={contentRef}
          contentEditable
          suppressContentEditableWarning
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              document.execCommand("insertLineBreak");
            }
          }}
          onInput={updateWordCount}
          onPaste={(e) => {
            e.preventDefault();
            const html = e.clipboardData.getData("text/html");
            const text = e.clipboardData.getData("text/plain");
            if (html) {
              const cleaned = html
                .replace(/style="[^"]*"/gi, "")
                .replace(/class="[^"]*"/gi, "")
                .replace(/<font[^>]*>([\s\S]*?)<\/font>/gi, "$1")
                .replace(/\s*size="[^"]*"/gi, "")
                .replace(/\s*face="[^"]*"/gi, "")
                .replace(/\s*color="[^"]*"/gi, "")
                .replace(/<blockquote[^>]*>/gi, "<p>")
                .replace(/<\/blockquote>/gi, "</p>");
              document.execCommand("insertHTML", false, cleaned);
            } else {
              document.execCommand("insertText", false, text);
            }
            updateWordCount();
          }}
          data-placeholder="begin writing..."
          className="min-h-[300px] text-lg leading-relaxed focus:outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/30 [&_*]:!text-[length:inherit] [&_*]:!font-[inherit]"
        />
        <EditorImageOverlay
          activeImg={activeImg}
          onDelete={removeImage}
          overlayRef={overlayRef}
        />
      </main>
    </div>
  );
};

export default Write;
