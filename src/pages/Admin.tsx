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
import { Trash2, Download, Search, Users, FileText, Filter } from "lucide-react";
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

const getDateFilterOptions = () => {
  const now = new Date();
  const options: { label: string; value: string }[] = [
    { label: "All time", value: "all" },
  ];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    options.push({ label, value: `month-${i}` });
  }
  const currentYear = now.getFullYear();
  for (let y = currentYear; y >= currentYear - 3; y--) {
    options.push({ label: `${y}`, value: `year-${y}` });
  }
  return options;
};

const filterByDate = (stories: StoryRow[], filterValue: string) => {
  if (filterValue === "all") return stories;
  const now = new Date();
  if (filterValue.startsWith("month-")) {
    const monthsAgo = parseInt(filterValue.split("-")[1]);
    const start = new Date(now.getFullYear(), now.getMonth() - monthsAgo, 1);
    const end = new Date(now.getFullYear(), now.getMonth() - monthsAgo + 1, 0, 23, 59, 59);
    return stories.filter((s) => {
      const d = new Date(s.published_at || s.published_at || "");
      return d >= start && d <= end;
    });
  }
  if (filterValue.startsWith("year-")) {
    const year = parseInt(filterValue.split("-")[1]);
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31, 23, 59, 59);
    return stories.filter((s) => {
      const d = new Date(s.published_at || "");
      return d >= start && d <= end;
    });
  }
  return stories;
};

const Admin = () => {
  const navigate = useNavigate();
  const { isFounder, loading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stories, setStories] = useState<StoryRow[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [storySearch, setStorySearch] = useState("");
  const [storyUserFilter, setStoryUserFilter] = useState<string>("all");
  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [dateFilter, setDateFilter] = useState("all");
  const qc = useQueryClient();

  const dateOptions = useMemo(() => getDateFilterOptions(), []);

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
      .eq("is_draft", false)
      .order("published_at", { ascending: false });
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
    let result = stories;
    if (storyUserFilter !== "all") {
      result = result.filter((s) => s.user_id === storyUserFilter);
    }
    result = filterByDate(result, dateFilter);
    if (storySearch.trim()) {
      const q = storySearch.toLowerCase();
      result = result.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.author_name.toLowerCase().includes(q) ||
          s.author_username.toLowerCase().includes(q)
      );
    }
    return result;
  }, [stories, storyUserFilter, dateFilter, storySearch]);

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

  const storyAuthors = useMemo(() => {
    const map = new Map<string, { user_id: string; name: string; username: string }>();
    stories.forEach((s) => {
      if (!map.has(s.user_id)) {
        map.set(s.user_id, { user_id: s.user_id, name: s.author_name, username: s.author_username });
      }
    });
    return Array.from(map.values());
  }, [stories]);

  const toggleStorySelect = (id: string) => {
    const next = new Set(selectedStories);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelectedStories(next);
  };

  const toggleAllStories = () => {
    if (selectedStories.size === filteredStories.length) {
      setSelectedStories(new Set());
    } else {
      setSelectedStories(new Set(filteredStories.map((s) => s.id)));
    }
  };

  const handleExportPDF = () => {
    if (!selectedStories.size) return;
    const toExport = stories
      .filter((s) => selectedStories.has(s.id))
      .map((s) => ({
        title: s.title, subtitle: s.subtitle, content: s.content,
        published_at: s.published_at, author_name: s.author_name,
      }));
    exportArticlesToPDF(toExport, "admin-backup");
    toast.success(`exported ${toExport.length} article(s)`);
  };

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
                <FileText className="h-3.5 w-3.5 mr-1.5" /> Stories & Backup
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

            {/* Stories & Backup Tab (merged) */}
            <TabsContent value="stories" className="mt-4">
              {/* Filters row */}
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <select
                  value={storyUserFilter}
                  onChange={(e) => { setStoryUserFilter(e.target.value); setSelectedStories(new Set()); }}
                  className="flex-1 min-w-[180px] rounded-md border border-border bg-transparent px-3 py-2 text-xs focus:outline-none focus:border-foreground transition-colors"
                >
                  <option value="all">All users ({stories.length})</option>
                  {storyAuthors.map((a) => (
                    <option key={a.user_id} value={a.user_id}>
                      {a.name} (@{a.username})
                    </option>
                  ))}
                </select>
                <div className="flex items-center gap-1.5">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <select
                    value={dateFilter}
                    onChange={(e) => { setDateFilter(e.target.value); setSelectedStories(new Set()); }}
                    className="rounded-md border border-border bg-transparent px-2 py-2 text-xs focus:outline-none focus:border-foreground transition-colors"
                  >
                    {dateOptions.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Select all + Download */}
              <div className="mb-3 flex items-center justify-between">
                <button onClick={toggleAllStories} className="text-xs text-muted-foreground hover:text-foreground">
                  {selectedStories.size === filteredStories.length && filteredStories.length > 0 ? "Deselect all" : "Select all"}
                </button>
                <Button onClick={handleExportPDF} disabled={!selectedStories.size} size="sm" className="gap-2">
                  <Download className="h-3.5 w-3.5" /> Download PDF ({selectedStories.size})
                </Button>
              </div>

              {/* Stories list */}
              <div className="divide-y divide-border rounded-md border border-border">
                {filteredStories.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">no stories found</p>
                ) : (
                  filteredStories.map((s) => (
                    <div key={s.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50">
                      <Checkbox
                        checked={selectedStories.has(s.id)}
                        onCheckedChange={() => toggleStorySelect(s.id)}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{s.title || "untitled"}</p>
                        <p className="text-xs text-muted-foreground">
                          by {s.author_name} · {s.published_at ? new Date(s.published_at).toLocaleDateString() : "draft"} · {s.views} views
                        </p>
                      </div>
                      <button onClick={() => deleteStory(s.id)} className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))
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
