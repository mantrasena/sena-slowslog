import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Story, Role } from "@/lib/types";

const mapStory = (row: any): Story => ({
  ...row,
  visibility: (row.visibility || "public") as Story["visibility"],
  author: row.profiles
    ? {
        id: row.profiles.id,
        user_id: row.profiles.user_id,
        display_name: row.profiles.display_name,
        username: row.profiles.username,
        avatar_url: row.profiles.avatar_url,
        bio: row.profiles.bio || "",
        role: row.user_roles?.[0]?.role || "writer",
      }
    : undefined,
});

export const usePublishedStories = () =>
  useQuery({
    queryKey: ["stories", "published"],
    queryFn: async () => {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("is_draft", false)
        .order("published_at", { ascending: false });

      if (!data || data.length === 0) return [];

      const userIds = [...new Set(data.map((s: any) => s.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", userIds);
      const { data: roles } = await supabase.from("user_roles").select("*").in("user_id", userIds);

      const profileMap = new Map((profiles || []).map((p) => [p.user_id, p]));
      const roleMap = new Map((roles || []).map((r) => [r.user_id, r.role]));

      return data.map((s: any) => {
        const p = profileMap.get(s.user_id);
        return mapStory({
          ...s,
          profiles: p || null,
          user_roles: [{ role: roleMap.get(s.user_id) || "writer" }],
        });
      });
    },
  });

export const useMyDrafts = () =>
  useQuery({
    queryKey: ["stories", "drafts"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_draft", true)
        .order("updated_at", { ascending: false });
      return data || [];
    },
  });

export const useStory = (id: string | undefined) =>
  useQuery({
    queryKey: ["story", id],
    enabled: !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("id", id!)
        .single();
      if (!data) return null;

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", data.user_id)
        .single();

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.user_id);

      return mapStory({ ...data, profiles: profile, user_roles: roles || [{ role: "writer" }] });
    },
  });

export const useUserStories = (userId: string | undefined) =>
  useQuery({
    queryKey: ["stories", "user", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("user_id", userId!)
        .eq("is_draft", false)
        .order("is_pinned", { ascending: false })
        .order("published_at", { ascending: false });

      if (!data || data.length === 0) return [];

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", userId!)
        .single();

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId!);

      return data.map((s: any) => mapStory({ ...s, profiles: profile, user_roles: roles || [{ role: "writer" }] }));
    },
  });

export const useSaveStory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (story: { id?: string; title: string; subtitle: string; content: string; is_draft: boolean }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      if (story.id) {
        // Check if this story was already published — preserve original date
        const { data: existing } = await supabase
          .from("stories")
          .select("published_at, is_draft")
          .eq("id", story.id)
          .single();

        const wasPublished = existing && !existing.is_draft && existing.published_at;

        const { data, error } = await supabase
          .from("stories")
          .update({
            title: story.title,
            subtitle: story.subtitle,
            content: story.content,
            is_draft: story.is_draft,
            published_at: story.is_draft ? null : (wasPublished ? existing.published_at : new Date().toISOString()),
          })
          .eq("id", story.id)
          .select()
          .single();
        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("stories")
          .insert({
            user_id: user.id,
            title: story.title,
            subtitle: story.subtitle,
            content: story.content,
            is_draft: story.is_draft,
            published_at: story.is_draft ? null : new Date().toISOString(),
          })
          .select()
          .single();
        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stories"] });
    },
  });
};

export const useDeleteStory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("stories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stories"] });
    },
  });
};

export const useTogglePin = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase.from("stories").update({ is_pinned: pinned }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stories"] });
      qc.invalidateQueries({ queryKey: ["story"] });
    },
  });
};

export const useToggleVisibility = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, visibility }: { id: string; visibility: "public" | "inner_circle" }) => {
      const { error } = await supabase.from("stories").update({ visibility }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stories"] });
      qc.invalidateQueries({ queryKey: ["story"] });
    },
  });
};

export const useToggleHidden = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, is_hidden }: { id: string; is_hidden: boolean }) => {
      const { error } = await supabase.from("stories").update({ is_hidden }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stories"] });
      qc.invalidateQueries({ queryKey: ["story"] });
    },
  });
};
