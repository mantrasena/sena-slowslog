import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { exportArticlesToPDF } from "@/lib/pdf-export";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, FileText, PenLine, Bookmark, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import StoryCard from "@/components/StoryCard";
import type { Story } from "@/lib/types";

const Settings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, profile, loading } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bio, setBio] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [editingUsername, setEditingUsername] = useState(false);
  const [savingUsername, setSavingUsername] = useState(false);

  // Fetch published stories for PDF backup
  const { data: stories } = useQuery({
    queryKey: ["my-stories-for-backup"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_draft", false)
        .order("published_at", { ascending: false });
      return data || [];
    },
  });

  // Fetch bookmarked stories
  const { data: bookmarkedStories, isLoading: bookmarksLoading } = useQuery({
    queryKey: ["bookmarks", "stories-full"],
    enabled: !!user,
    queryFn: async () => {
      const { data: bookmarks } = await supabase
        .from("bookmarks")
        .select("story_id")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (!bookmarks?.length) return [];

      const storyIds = bookmarks.map((b: any) => b.story_id);
      const { data: storiesData } = await supabase
        .from("stories")
        .select("*")
        .in("id", storyIds)
        .eq("is_draft", false);

      if (!storiesData?.length) return [];

      const userIds = [...new Set(storiesData.map((s) => s.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);
      const { data: roles } = await supabase.from("user_roles").select("*").in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      const roleMap = new Map((roles || []).map((r) => [r.user_id, r.role]));

      return storiesData.map((s): Story => {
        const p = profileMap.get(s.user_id);
        return {
          ...s,
          author: p ? {
            id: p.id,
            user_id: p.user_id,
            display_name: p.display_name,
            username: p.username,
            avatar_url: p.avatar_url,
            bio: p.bio || "",
            role: (roleMap.get(s.user_id) || "writer") as any,
          } : undefined,
        };
      });
    },
  });

  // Fetch drafts
  const { data: drafts, isLoading: draftsLoading } = useQuery({
    queryKey: ["my-drafts"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_draft", true)
        .order("updated_at", { ascending: false });
      return data || [];
    },
  });

  if (loading) return null;
  if (!user) {
    navigate("/auth");
    return null;
  }

  const currentBio = bio ?? profile?.bio ?? "";

  const handleSaveBio = async () => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ bio: currentBio })
      .eq("user_id", user.id);
    setSaving(false);
    if (error) {
      toast.error("Failed to update bio");
    } else {
      toast.success("Bio updated (◕‿◕)");
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    }
  };

  // PDF export helpers
  const toggleAll = () => {
    if (selected.size === (stories?.length || 0)) {
      setSelected(new Set());
    } else {
      setSelected(new Set((stories || []).map((s) => s.id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleExport = () => {
    if (!selected.size || !stories) return;
    const toExport = stories.filter((s) => selected.has(s.id)).map((s) => ({
      title: s.title,
      subtitle: s.subtitle,
      content: s.content,
      published_at: s.published_at,
    }));
    exportArticlesToPDF(toExport, "my-articles-backup");
    toast.success(`exported ${toExport.length} article(s) (◕‿◕)`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-6 py-12">
          <h1 className="font-serif text-xl font-medium">settings</h1>
          <p className="mt-1 text-xs text-muted-foreground">manage your account (◕ᴗ◕✿)</p>

          <Tabs defaultValue="profile" className="mt-8">
            <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0">
              <TabsTrigger value="profile" className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                <UserIcon className="h-3.5 w-3.5 mr-1.5" /> Profile
              </TabsTrigger>
              <TabsTrigger value="drafts" className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                <FileText className="h-3.5 w-3.5 mr-1.5" /> Drafts
              </TabsTrigger>
              <TabsTrigger value="bookmarks" className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                <Bookmark className="h-3.5 w-3.5 mr-1.5" /> Bookmarks
              </TabsTrigger>
              <TabsTrigger value="backup" className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Backup
              </TabsTrigger>
            </TabsList>

            {/* Profile Tab */}
            <TabsContent value="profile" className="mt-6">
              <div className="space-y-6">
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Username</label>
                  <p className="mt-1 text-sm">@{profile?.username}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Email</label>
                  <p className="mt-1 text-sm">{user.email}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground">Display Name</label>
                  <p className="mt-1 text-sm">{profile?.display_name}</p>
                </div>
                <div>
                  <label htmlFor="bio" className="text-xs font-medium text-muted-foreground">Bio</label>
                  <textarea
                    id="bio"
                    value={currentBio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    placeholder="Tell us about yourself..."
                    className="mt-1 w-full resize-none rounded-md border border-border bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground/50 focus:border-foreground focus:outline-none transition-colors"
                  />
                  <Button
                    onClick={handleSaveBio}
                    disabled={saving || currentBio === (profile?.bio ?? "")}
                    size="sm"
                    className="mt-2"
                  >
                    {saving ? "saving..." : "Save bio"}
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Drafts Tab */}
            <TabsContent value="drafts" className="mt-6">
              <div className="divide-y divide-border">
                {draftsLoading ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">loading...</p>
                ) : !drafts?.length ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">no drafts yet (◡‿◡)</p>
                ) : (
                  drafts.map((draft) => (
                    <div key={draft.id} className="flex items-center justify-between py-4">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium">{draft.title || "untitled"}</p>
                          {draft.subtitle && <p className="text-xs text-muted-foreground">{draft.subtitle}</p>}
                        </div>
                      </div>
                      <Link
                        to={`/write?edit=${draft.id}`}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <PenLine className="h-3 w-3" /> edit
                      </Link>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>

            {/* Bookmarks Tab */}
            <TabsContent value="bookmarks" className="mt-6">
              <div className="divide-y divide-border">
                {bookmarksLoading ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">loading...</p>
                ) : !bookmarkedStories?.length ? (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    belum ada bookmark. coba simpan artikel yang kamu suka! ✿
                  </p>
                ) : (
                  bookmarkedStories.map((story) => (
                    <StoryCard key={story.id} story={story} />
                  ))
                )}
              </div>
            </TabsContent>

            {/* Backup PDF Tab */}
            <TabsContent value="backup" className="mt-6">
              <h2 className="flex items-center gap-2 text-sm font-medium">
                <FileText className="h-4 w-4" /> Backup Artikel ke PDF
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Pilih artikel yang ingin kamu backup, lalu download sebagai PDF.
              </p>

              {!stories?.length ? (
                <p className="mt-6 text-sm text-muted-foreground">belum ada artikel yang dipublish.</p>
              ) : (
                <>
                  <div className="mt-4 flex items-center justify-between">
                    <button onClick={toggleAll} className="text-xs text-muted-foreground hover:text-foreground">
                      {selected.size === stories.length ? "Deselect all" : "Select all"}
                    </button>
                    <Button
                      onClick={handleExport}
                      disabled={!selected.size}
                      size="sm"
                      className="gap-2"
                    >
                      <Download className="h-3.5 w-3.5" /> Download PDF ({selected.size})
                    </Button>
                  </div>

                  <div className="mt-3 divide-y divide-border rounded-md border border-border">
                    {stories.map((s) => (
                      <label
                        key={s.id}
                        className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/50"
                      >
                        <Checkbox
                          checked={selected.has(s.id)}
                          onCheckedChange={() => toggle(s.id)}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="truncate text-sm font-medium">{s.title || "Untitled"}</p>
                          <p className="text-xs text-muted-foreground">
                            {s.published_at ? new Date(s.published_at).toLocaleDateString() : ""}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Settings;
