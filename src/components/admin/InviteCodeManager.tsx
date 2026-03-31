import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, KeyRound, Copy } from "lucide-react";

interface InviteCode {
  id: string;
  code: string;
  max_uses: number | null;
  used_count: number;
  is_active: boolean;
  created_at: string;
}

const InviteCodeManager = () => {
  const [showForm, setShowForm] = useState(false);
  const [code, setCode] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: codes = [], refetch } = useQuery({
    queryKey: ["admin-invite-codes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("invite_codes")
        .select("*")
        .order("created_at", { ascending: false });
      return (data || []) as InviteCode[];
    },
  });

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "SENA-";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCode(result);
  };

  const handleCreate = async () => {
    if (!code.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("invite_codes").insert({
        code: code.trim().toUpperCase(),
        max_uses: maxUses ? parseInt(maxUses) : null,
      } as any);
      if (error) throw error;
      toast.success("Invite code created (★‿★)");
      setShowForm(false);
      setCode("");
      setMaxUses("");
      refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to create invite code");
    } finally {
      setSubmitting(false);
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    await supabase.from("invite_codes").update({ is_active: !currentActive } as any).eq("id", id);
    toast.success(currentActive ? "Code deactivated" : "Code activated");
    refetch();
  };

  const deleteCode = async (id: string) => {
    await supabase.from("invite_codes").delete().eq("id", id);
    toast.success("Code deleted");
    refetch();
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Copied!");
  };

  return (
    <div className="rounded-lg border border-border p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[hsl(200,60%,92%)]">
            <KeyRound className="h-5 w-5 text-[hsl(200,60%,50%)]" />
          </div>
          <div>
            <h3 className="text-sm font-medium">Invite Codes</h3>
            <p className="text-xs text-muted-foreground">
              {codes.filter((c) => c.is_active).length} active code(s)
            </p>
          </div>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => { setShowForm(!showForm); if (!showForm) generateCode(); }}
          className="gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" />
          New
        </Button>
      </div>

      {showForm && (
        <div className="mt-4 space-y-3 rounded-lg border border-dashed border-border p-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Invite Code</Label>
            <div className="flex gap-2">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SENA-XXXXXX"
                className="font-mono text-sm"
              />
              <Button size="sm" variant="outline" onClick={generateCode} className="text-xs flex-shrink-0">
                Generate
              </Button>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Max Uses (leave empty for unlimited)</Label>
            <Input
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Unlimited"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" onClick={() => setShowForm(false)} className="flex-1">
              Cancel
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={submitting || !code.trim()} className="flex-1">
              {submitting ? "Creating..." : "Create Code"}
            </Button>
          </div>
        </div>
      )}

      {codes.length > 0 && (
        <div className="mt-4 divide-y divide-border rounded-md border border-border">
          {codes.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">{c.code}</code>
                  <button onClick={() => copyCode(c.code)} className="text-muted-foreground hover:text-foreground">
                    <Copy className="h-3 w-3" />
                  </button>
                  <span className={`text-[10px] font-medium ${c.is_active ? "text-[hsl(140,50%,40%)]" : "text-muted-foreground"}`}>
                    {c.is_active ? "active" : "inactive"}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {c.used_count}/{c.max_uses ?? "∞"} used
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Switch
                  checked={c.is_active}
                  onCheckedChange={() => toggleActive(c.id, c.is_active)}
                />
                <button
                  onClick={() => deleteCode(c.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default InviteCodeManager;
