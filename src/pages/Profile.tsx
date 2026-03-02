import { useParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoryCard from "@/components/StoryCard";
import RoleBadge from "@/components/RoleBadge";
import { currentUser, mockStories } from "@/lib/mock-data";
import { Settings, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const Profile = () => {
  const { username } = useParams();
  const user = currentUser; // mock
  const userStories = mockStories.filter((s) => s.author.id === user.id);
  const pinnedStories = userStories.filter((s) => s.pinned);
  const otherStories = userStories.filter((s) => !s.pinned);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-6 py-12">
          {/* Profile header */}
          <div className="flex items-start gap-6">
            <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-muted text-2xl font-semibold text-muted-foreground">
              {user.name[0]}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="font-serif text-2xl font-semibold">{user.name}</h1>
                <RoleBadge role={user.role} />
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">@{user.username}</p>
              <div className="mt-1.5 flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" /> {user.storyCount} stories
                </span>
                <span>Joined {user.joinedDate}</span>
              </div>
            </div>
            <button className="flex h-9 w-9 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:text-foreground">
              <Settings className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-6 text-muted-foreground">{user.bio}</p>

          {/* Tabs */}
          <Tabs defaultValue="stories" className="mt-10">
            <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start gap-0 h-auto p-0">
              <TabsTrigger
                value="stories"
                className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Stories
              </TabsTrigger>
              <TabsTrigger
                value="achievements"
                className="rounded-none border-b-2 border-transparent px-4 py-2.5 text-sm data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                Achievements
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
              </div>
            </TabsContent>
            <TabsContent value="achievements" className="py-12 text-center text-muted-foreground">
              <p>No achievements yet. Keep writing! ✍️</p>
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Profile;
