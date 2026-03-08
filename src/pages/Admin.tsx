import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import RoleBadge from "@/components/RoleBadge";
import { Trash2, Download, ChevronDown, ChevronRight, Search, Users, FileText } from "lucide-react";
import { exportArticlesToPDF } from "@/lib/pdf-export";
import type { Role } from "@/lib/types";
import { ROLE_LABELS } from "@/lib/types";

interface UserRow {
  user_id: string;
  username: string;
  display_name: string;
  created_at: string;
  role: Role;
}

interface StoryRow {
  id: string;
  title: string;
  user_id: string;
  is_draft: boolean;
  published_at: string | null;
  views: number;
  content: string | null;
  subtitle: string | null;
  author_name: string;
  author_username: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { isFounder, loading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [storyUserFilter, setStoryUserFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [backupMode, setBackupMode] = useState<"all" | "pick">("all");
  const qc = useQueryClient();

  useEffect(() => {
    if (!loading && !isFounder) navigate("/");
  }, [loading, isFounder]);

  useEffect(() => {
    fetchUsers();
    fetchStories();
  }, []);

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (!profiles) return;
    const userIds = profiles.map((p) => p.user_id);
    const { data: roles } = await supabase.from("user_roles").select("*").in("user_id", userIds);
    setUsers(
      profiles.map((p) => ({
        user_id: p.user_id,
        username: p.username,
        display_name: p.display_name,
        created_at: p.created_at,
        role: (roles?.find((r) => r.user_id === p.user_id)?.role || "writer") as Role,
      }))
    );
  };

  const fetchStories = async () => {
    const { data: storiesData } = await supabase
      .from("stories")
      .select("*")
      .order("created_at", { ascending: false });
    if (!storiesData) return setStories([]);
    const userIds = [...new Set(storiesData.map((s) => s.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);
    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
    setStories(
      storiesData.map((s: any) => ({
        id: s.id,
        title: s.title,
        subtitle: s.subtitle,
        content: s.content,
        user_id: s.user_id,
        is_draft: s.is_draft,
        published_at: s.published_at,
        views: s.views,
        author_name: profileMap.get(s.user_id)?.display_name || "unknown",
        author_username: profileMap.get(s.user_id)?.username || "unknown",
      }))
    );
  };

  const filteredUsers = useMemo(() => {
    if (!userSearch.trim()) return users;
    const q = userSearch.toLowerCase();
    return users.filter(
      (u) => u.username.toLowerCase().includes(q) || u.display_name.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const filteredStories = useMemo(() => {
    if (storyUserFilter === "all") return stories;
    return stories.filter((s) => s.user_id === storyUserFilter);
  }, [stories, storyUserFilter]);

  const changeRole = async (userId: string, newRole: Role) => {
    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role: newRole });
    toast.success("role updated (◕‿◕)");
    fetchUsers();
  };

  const deleteStory = async (id: string) => {
    await supabase.from("stories").delete().eq("id", id);
    toast.success("story deleted");
    fetchStories();
    qc.invalidateQueries({ queryKey: ["stories"] });
  };

  const handleBackupPDF = () => {
    if (backupMode === "all") {
      if (!selectedUsers.size) return;
      const toExport = stories
        .filter((s) => selectedUsers.has(s.user_id) && !s.is_draft)
        .map((s) => ({
          title: s.title, subtitle: s.subtitle, content: s.content,
          published_at: s.published_at, author_name: s.author_name,
        }));
      if (!toExport.length) return toast.error("no published articles found");
      exportArticlesToPDF(toExport, "admin-backup");
      toast.success(`exported ${toExport.length} article(s)`);
    } else {
      if (!selectedStories.size) return;
      const toExport = stories
        .filter((s) => selectedStories.has(s.id))
        .map((s) => ({
          title: s.title, subtitle: s.subtitle, content: s.content,
          published_at: s.published_at, author_name: s.author_name,
        }));
      exportArticlesToPDF(toExport, "admin-backup-selected");
      toast.success(`exported ${toExport.length} article(s)`);
    }
  };

  const toggleUser = (uid: string) => {
    const next = new Set(selectedUsers);
    if (next.has(uid)) next.delete(uid); else next.add(uid);
    setSelectedUsers(next);
  };

  const toggleStorySelect = (id: string) => {
    const next = new Set(selectedStories);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedStories(next);
  };

  const userStories = (uid: string) => stories.filter((s) => s.user_id === uid && !s.is_draft);

  // Get unique authors for dropdown
  const storyAuthors = useMemo(() => {
    const map = new Map<string, { user_id: string; name: string; username: string }>();
    stories.forEach((s) => {
      if (!map.has(s.user_id)) {
        map.set(s.user_id, { user_id: s.user_id, name: s.author_name, username: s.author_username });
      }
    });
    return Array.from(map.values());
  }, [stories]);

  if (loading) return null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-3xl px-6 py-12">
          <h1 className="font-serif text-xl font-medium">admin dashboard</h1>
          <p className="mt-1 text-xs text-muted-foreground">founder access only (*´▽`*)</p>

          <Tabs defaultValue="users" className="mt-8">
            <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0">
              <TabsTrigger value="users" className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                <Users className="h-3.5 w-3.5 mr-1.5" /> Users ({users.length})
              </TabsTrigger>
              <TabsTrigger value="stories" className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                <FileText className="h-3.5 w-3.5 mr-1.5" /> Stories ({stories.length})
              </TabsTrigger>
              <TabsTrigger value="backup" className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                <Download className="h-3.5 w-3.5 mr-1.5" /> Backup
              </TabsTrigger>
            </TabsList>

            {/* Users Tab */}
            <TabsContent value="users" className="mt-4">
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Search by username or display name..."
                    className="w-full rounded-md border border-border bg-transparent py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground/50 focus:border-foreground focus:outline-none transition-colors"
                  />
                </div>
                {userSearch && (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {filteredUsers.length} result(s)
                  </p>
                )}
              </div>
              <div className="divide-y divide-border">
                {filteredUsers.map((u) => (
                  <div key={u.user_id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium text-muted-foreground">
                        {u.display_name[0]}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{u.display_name}</p>
                          <RoleBadge role={u.role} variant="card" />
                        </div>
                        <p className="text-xs text-muted-foreground">@{u.username}</p>
                      </div>
                    </div>
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.user_id, e.target.value as Role)}
                      className="rounded-md border border-border bg-transparent px-2 py-1 text-xs focus:outline-none"
                    >
                      {(["founder", "early_adopter", "contributor", "writer"] as Role[]).map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </div>
                ))}
                {filteredUsers.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">no users found (◕︿◕)</p>
                )}
              </div>
            </TabsContent>

            {/* Stories Tab */}
            <TabsContent value="stories" className="mt-4">
              <div className="mb-4">
                <select
                  value={storyUserFilter}
                  onChange={(e) => setStoryUserFilter(e.target.value)}
                  className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                >
                  <option value="all">All users ({stories.length} stories)</option>
                  {storyAuthors.map((a) => (
                    <option key={a.user_id} value={a.user_id}>
                      {a.name} (@{a.username}) — {stories.filter((s) => s.user_id === a.user_id).length} stories
                    </option>
                  ))}
                </select>
              </div>
              <div className="divide-y divide-border">
                {filteredStories.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{s.title || "untitled"}</p>
                      <p className="text-xs text-muted-foreground">
                        by {s.author_name} (@{s.author_username}) · {s.is_draft ? "draft" : "published"} · {s.views} views
                      </p>
                    </div>
                    <button onClick={() => deleteStory(s.id)} className="ml-3 flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                {filteredStories.length === 0 && (
                  <p className="py-8 text-center text-sm text-muted-foreground">no stories found</p>
                )}
              </div>
            </TabsContent>

            {/* Backup Tab */}
            <TabsContent value="backup" className="mt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <select
                    value={backupMode}
                    onChange={(e) => setBackupMode(e.target.value as "all" | "pick")}
                    className="rounded-md border border-border bg-transparent px-2 py-1 text-xs focus:outline-none"
                  >
                    <option value="all">Semua artikel per user</option>
                    <option value="pick">Pilih artikel spesifik</option>
                  </select>
                  <Button onClick={handleBackupPDF} size="sm" className="gap-2">
                    <Download className="h-3.5 w-3.5" /> Download PDF
                  </Button>
                </div>

                {backupMode === "all" ? (
                  <>
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => {
                          if (selectedUsers.size === users.length) setSelectedUsers(new Set());
                          else setSelectedUsers(new Set(users.map((u) => u.user_id)));
                        }}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        {selectedUsers.size === users.length ? "Deselect all" : "Select all users"}
                      </button>
                      <span className="text-xs text-muted-foreground">{selectedUsers.size} selected</span>
                    </div>
                    <div className="divide-y divide-border rounded-md border border-border">
                      {users.map((u) => (
                        <label key={u.user_id} className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/50">
                          <Checkbox checked={selectedUsers.has(u.user_id)} onCheckedChange={() => toggleUser(u.user_id)} />
                          <div className="flex-1">
                            <p className="text-sm font-medium">{u.display_name}</p>
                            <p className="text-xs text-muted-foreground">
                              @{u.username} · {userStories(u.user_id).length} published articles
                            </p>
                          </div>
                        </label>
                      ))}
                    </div>
                  </>
                ) : (
                  <div className="divide-y divide-border rounded-md border border-border">
                    {users.map((u) => {
                      const uStories = userStories(u.user_id);
                      if (!uStories.length) return null;
                      const isExpanded = expandedUser === u.user_id;
                      return (
                        <div key={u.user_id}>
                          <button
                            onClick={() => setExpandedUser(isExpanded ? null : u.user_id)}
                            className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/50"
                          >
                            {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                            <span className="text-sm font-medium">{u.display_name}</span>
                            <span className="text-xs text-muted-foreground">({uStories.length})</span>
                          </button>
                          {isExpanded && (
                            <div className="border-t border-border bg-muted/20">
                              {uStories.map((s) => (
                                <label key={s.id} className="flex cursor-pointer items-center gap-3 px-8 py-2 hover:bg-muted/50">
                                  <Checkbox checked={selectedStories.has(s.id)} onCheckedChange={() => toggleStorySelect(s.id)} />
                                  <p className="truncate text-sm">{s.title || "Untitled"}</p>
                                </label>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
};

export default Admin;
