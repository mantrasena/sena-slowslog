import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useMyDrafts, useDeleteStory } from "@/hooks/useStories";
import { useAuth } from "@/hooks/useAuth";
import { FileText, PenLine, Trash2, Clock, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { differenceInDays } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const getDaysLeft = (updatedAt: string) => {
  const days = 14 - differenceInDays(new Date(), new Date(updatedAt));
  return Math.max(0, days);
};

const Drafts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: drafts, isLoading } = useMyDrafts();
  const deleteMutation = useDeleteStory();
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (!user) navigate("/auth");
  }, [user]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast.success("draft deleted (◕‿◕)");
      setDeleteTarget(null);
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

          {/* Warning banner */}
          <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-border bg-muted/50 px-4 py-3">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              Drafts are automatically deleted after <span className="font-medium text-foreground">14 days</span> of no edits. Edit or publish your drafts to keep them.
            </p>
          </div>

          <div className="mt-6 divide-y divide-border">
            {isLoading ? (
              <p className="py-12 text-center text-sm text-muted-foreground">loading...</p>
            ) : !drafts?.length ? (
              <p className="py-12 text-center text-sm text-muted-foreground">no drafts yet (◡‿◡)</p>
            ) : (
              drafts.map((draft) => {
                const daysLeft = getDaysLeft(draft.updated_at);
                const isUrgent = daysLeft <= 3;

                return (
                  <div key={draft.id} className="flex items-center justify-between py-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{draft.title || "untitled"}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          {draft.subtitle && <p className="text-xs text-muted-foreground truncate">{draft.subtitle}</p>}
                          <span className={`flex items-center gap-1 text-[10px] shrink-0 ${isUrgent ? "text-destructive" : "text-muted-foreground"}`}>
                            <Clock className="h-2.5 w-2.5" />
                            {daysLeft === 0 ? "expires today" : `${daysLeft}d left`}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <Link
                        to={`/write?edit=${draft.id}`}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <PenLine className="h-3 w-3" /> edit
                      </Link>
                      <button
                        onClick={() => setDeleteTarget({ id: draft.id, title: draft.title })}
                        disabled={deleteMutation.isPending}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" /> delete
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
      <Footer />

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this draft?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete "{deleteTarget?.title || "untitled"}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, keep it</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Yes, delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Drafts;
