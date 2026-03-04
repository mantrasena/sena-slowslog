import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoryCard from "@/components/StoryCard";
import { usePublishedStories } from "@/hooks/useStories";

const Index = () => {
  const { data: stories, isLoading } = usePublishedStories();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 text-center md:py-24">
          <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">
            only writing and kaomoji.
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            no rush. just words. (◕‿◕)
          </p>
        </section>

        <section className="mx-auto max-w-2xl px-6 pb-16">
          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">loading...</p>
          ) : !stories?.length ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              no stories yet. be the first to write. ✍(◔◡◔)
            </p>
          ) : (
            <div className="divide-y divide-border">
              {stories.map((story) => (
                <StoryCard key={story.id} story={story} />
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
