import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StoryCard from "@/components/StoryCard";
import { mockStories } from "@/lib/mock-data";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-16 text-center md:py-24">
          <h1 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl lg:text-5xl">
            Only writing and kaomoji.
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            No rush. Just words.
          </p>
        </section>

        {/* Feed */}
        <section className="mx-auto max-w-2xl px-6 pb-16">
          <div className="divide-y divide-border">
            {mockStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
