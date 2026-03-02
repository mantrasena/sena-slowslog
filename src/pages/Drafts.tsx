import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { mockDrafts } from "@/lib/mock-data";
import { FileText, PenLine } from "lucide-react";
import { Link } from "react-router-dom";

const Drafts = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-6 py-12">
          <h1 className="font-serif text-2xl font-semibold">Drafts</h1>
          <div className="mt-8 divide-y divide-border">
            {mockDrafts.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No drafts yet.</p>
            ) : (
              mockDrafts.map((draft) => (
                <div key={draft.id} className="flex items-center justify-between py-5 animate-fade-in">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{draft.title || "Untitled"}</p>
                      {draft.subtitle && (
                        <p className="text-sm text-muted-foreground">{draft.subtitle}</p>
                      )}
                    </div>
                  </div>
                  <Link
                    to="/write"
                    className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <PenLine className="h-3.5 w-3.5" /> Edit
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Drafts;
