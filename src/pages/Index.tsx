import { useState } from "react";
import Header from "@/components/Header";
import HomepagePopup from "@/components/HomepagePopup";
import Footer from "@/components/Footer";
import StoryCard from "@/components/StoryCard";
import { usePublishedStories } from "@/hooks/useStories";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";

const STORIES_PER_PAGE = 20;

const Index = () => {
  const { data: stories, isLoading } = usePublishedStories();
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil((stories?.length || 0) / STORIES_PER_PAGE);
  const paginatedStories = stories?.slice(
    (currentPage - 1) * STORIES_PER_PAGE,
    currentPage * STORIES_PER_PAGE
  );

  const getPageNumbers = () => {
    const pages: (number | "ellipsis")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("ellipsis");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("ellipsis");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="py-16 text-center md:py-24">
          <h1 className="font-serif text-3xl font-medium tracking-tight md:text-4xl">only writing.</h1>
          <p className="mt-2 text-muted-foreground font-mono text-base">No rush. Just words.</p>
        </section>

        <section className="mx-auto max-w-2xl px-6 pb-16">
          {isLoading ? (
            <p className="py-12 text-center text-sm text-muted-foreground">loading...</p>
          ) : !stories?.length ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              no stories yet. be the first to write. ✍(◔◡◔)
            </p>
          ) : (
            <>
              <div className="divide-y divide-border">
                {paginatedStories?.map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination className="mt-8">
                  <PaginationContent>
                    {currentPage > 1 && (
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => { e.preventDefault(); setCurrentPage(currentPage - 1); window.scrollTo(0, 0); }}
                        />
                      </PaginationItem>
                    )}
                    {getPageNumbers().map((page, i) =>
                      page === "ellipsis" ? (
                        <PaginationItem key={`e-${i}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === page}
                            onClick={(e) => { e.preventDefault(); setCurrentPage(page as number); window.scrollTo(0, 0); }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    {currentPage < totalPages && (
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => { e.preventDefault(); setCurrentPage(currentPage + 1); window.scrollTo(0, 0); }}
                        />
                      </PaginationItem>
                    )}
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;
