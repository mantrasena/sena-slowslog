import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2 } from "lucide-react";
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
  author_name: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { isFounder, loading } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [stories, setStories] = useState<StoryRow[]>([]);
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
    const profileMap = new Map((profiles || []).map((p) => [p.user_id, p.display_name]));

    setStories(
      storiesData.map((s: any) => ({
        id: s.id,
        title: s.title,
        user_id: s.user_id,
        is_draft: s.is_draft,
        published_at: s.published_at,
        views: s.views,
        author_name: profileMap.get(s.user_id) || "unknown",
      }))
    );
  };

  const changeRole = async (userId: string, newRole: Role) => {
    // Delete existing role, insert new
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
                Users ({users.length})
              </TabsTrigger>
              <TabsTrigger value="stories" className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Stories ({stories.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-4">
              <div className="divide-y divide-border">
                {users.map((u) => (
                  <div key={u.user_id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{u.display_name}</p>
                      <p className="text-xs text-muted-foreground">@{u.username}</p>
                    </div>
                    <select
                      value={u.role}
                      onChange={(e) => changeRole(u.user_id, e.target.value as Role)}
                      className="rounded-md border border-border bg-transparent px-2 py-1 text-xs focus:outline-none"
                    >
                      {(["founder", "early_contributor", "contributor", "writer"] as Role[]).map((r) => (
                        <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="stories" className="mt-4">
              <div className="divide-y divide-border">
                {stories.map((s) => (
                  <div key={s.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium">{s.title || "untitled"}</p>
                      <p className="text-xs text-muted-foreground">
                        by {s.author_name} · {s.is_draft ? "draft" : "published"} · {s.views} views
                      </p>
                    </div>
                    <button
                      onClick={() => deleteStory(s.id)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  );
};

export default Admin;
