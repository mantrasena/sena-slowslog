import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useMyDrafts, useDeleteStory } from "@/hooks/useStories";
import { useAuth } from "@/hooks/useAuth";
import { FileText, PenLine, Trash2 } from "lucide-react";
import { toast } from "sonner";

const Drafts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: drafts, isLoading } = useMyDrafts();
  const deleteMutation = useDeleteStory();

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user]);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`delete "${title || "untitled"}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      toast.success("draft deleted (◕‿◕)");
    } catch {
      toast.error("failed to delete draft");
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-6 py-12">
          <h1 className="font-serif text-xl font-medium">drafts</h1>
          <div className="mt-6 divide-y divide-border">
            {isLoading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">loading...</p>
            ) : !drafts?.length ? (
              <p className="py-12 text-center text-sm text-muted-foreground">no drafts yet (◡‿◡)</p>
            ) : (
              drafts.map((draft) => (
                <div key={draft.id} className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">{draft.title || "untitled"}</p>
                      {draft.subtitle && <p className="text-xs text-muted-foreground">{draft.subtitle}</p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/write?edit=${draft.id}`}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <PenLine className="h-3 w-3" /> edit
                    </Link>
                    <button
                      onClick={() => handleDelete(draft.id, draft.title)}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" /> delete
                    </button>
                  </div>
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
