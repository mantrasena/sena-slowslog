import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { exportArticlesToPDF } from "@/lib/pdf-export";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data: stories } = useQuery({
    queryKey: ["my-stories-for-backup"],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("stories")
        .select("*")
        .eq("user_id", user!.id)
        .eq("is_draft", false)
        .order("published_at", { ascending: false });
      return data || [];
    },
  });

  if (loading) return null;
  if (!user) {
    navigate("/auth");
    return null;
  }

  const toggleAll = () => {
    if (selected.size === (stories?.length || 0)) {
      setSelected(new Set());
    } else {
      setSelected(new Set((stories || []).map((s) => s.id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handleExport = () => {
    if (!selected.size || !stories) return;
    const toExport = stories.filter((s) => selected.has(s.id)).map((s) => ({
      title: s.title,
      subtitle: s.subtitle,
      content: s.content,
      published_at: s.published_at,
    }));
    exportArticlesToPDF(toExport, "my-articles-backup");
    toast.success(`exported ${toExport.length} article(s) (◕‿◕)`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-2xl px-6 py-12">
          <h1 className="font-serif text-xl font-medium">settings</h1>
          <p className="mt-1 text-xs text-muted-foreground">manage your account (◕ᴗ◕✿)</p>

          <div className="mt-10">
            <h2 className="flex items-center gap-2 text-sm font-medium">
              <FileText className="h-4 w-4" /> Backup Artikel ke PDF
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Pilih artikel yang ingin kamu backup, lalu download sebagai PDF.
            </p>

            {!stories?.length ? (
              <p className="mt-6 text-sm text-muted-foreground">belum ada artikel yang dipublish.</p>
            ) : (
              <>
                <div className="mt-4 flex items-center justify-between">
                  <button onClick={toggleAll} className="text-xs text-muted-foreground hover:text-foreground">
                    {selected.size === stories.length ? "Deselect all" : "Select all"}
                  </button>
                  <Button
                    onClick={handleExport}
                    disabled={!selected.size}
                    size="sm"
                    className="gap-2"
                  >
                    <Download className="h-3.5 w-3.5" /> Download PDF ({selected.size})
                  </Button>
                </div>

                <div className="mt-3 divide-y divide-border rounded-md border border-border">
                  {stories.map((s) => (
                    <label
                      key={s.id}
                      className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={selected.has(s.id)}
                        onCheckedChange={() => toggle(s.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium">{s.title || "Untitled"}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.published_at ? new Date(s.published_at).toLocaleDateString() : ""}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default Settings;
