import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoryCard from "@/components/StoryCard";
import RoleBadge from "@/components/RoleBadge";
import { supabase } from "@/integrations/supabase/client";
import { useUserStories } from "@/hooks/useStories";
import { FileText, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import type { Role } from "@/lib/types";

const Profile = () => {
  const { username } = useParams();
  const { user } = useAuth();

  const { data: profileData } = useQuery({
    queryKey: ["profile", username],
    enabled: !!username,
    queryFn: async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username!)
        .single();
      if (!profile) return null;

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", profile.user_id);

      const storyCount = await supabase
        .from("stories")
        .select("id", { count: "exact", head: true })
        .eq("user_id", profile.user_id)
        .eq("is_draft", false);

      return {
        ...profile,
        role: (roles?.[0]?.role || "writer") as Role,
        storyCount: storyCount.count || 0,
      };
    },
  });

  const { data: stories } = useUserStories(profileData?.user_id);
  const pinnedStories = stories?.filter((s) => s.is_pinned) || [];
  const otherStories = stories?.filter((s) => !s.is_pinned) || [];

  const isOwnProfile = user && profileData && user.id === profileData.user_id;

  if (!profileData) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">loading...</p>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-6 py-12">
          <div className="flex items-start gap-5">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-muted text-lg font-medium text-muted-foreground">
              {profileData.display_name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="font-serif text-xl font-medium">{profileData.display_name}</h1>
                <RoleBadge role={profileData.role} />
              </div>
              <p className="text-xs text-muted-foreground">@{profileData.username}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-3 w-3" /> {profileData.storyCount} stories
                </span>
              </div>
            </div>
            {isOwnProfile && (
              <Link
                to="/settings"
                className="flex h-9 w-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                title="Settings"
              >
                <Settings className="h-4 w-4" />
              </Link>
            )}
          </div>

          {profileData.bio && <p className="mt-5 text-sm text-muted-foreground">{profileData.bio}</p>}

          <Tabs defaultValue="stories" className="mt-8">
            <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0">
              <TabsTrigger value="stories" className="rounded-none border-b-2 border-transparent px-4 py-2 text-xs data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none">
                Stories
              </TabsTrigger>
            </TabsList>
            <TabsContent value="stories" className="mt-2">
              <div className="divide-y divide-border">
                {pinnedStories.map((story) => (
                  <StoryCard key={story.id} story={story} showPinned />
                ))}
                {otherStories.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
                {!stories?.length && (
                  <p className="py-12 text-center text-sm text-muted-foreground">no stories yet ✍(◔◡◔)</p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
