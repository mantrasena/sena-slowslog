import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Upload, Loader2, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { compressImage } from "@/lib/image-compress";
import qrisImage from "@/assets/qris-digital-pustaka-senarasi.png";

const plans: Record<string, { name: string; price: string; period: string }> = {
  yearly: { name: "1 Year", price: "Rp. 99.000", period: "/year" },
  forever: { name: "Lifetime", price: "Rp. 299.000", period: " one-time" },
};

const InnerCirclePayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan");
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const plan = planId ? plans[planId] : null;

  // Redirect if no valid plan or not logged in
  if (!plan || !user) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">Invalid payment link.</p>
            <Button variant="outline" onClick={() => navigate("/inner-circle")}>
              Back to Inner Circle
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setProofFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  const handleSubmit = async () => {
    if (!proofFile || !planId) return;

    setSubmitting(true);
    try {
      const compressed = await compressImage(proofFile);
      const ext = proofFile.name.split(".").pop() || "jpg";
      const filePath = `${user.id}/${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("transfer-proofs")
        .upload(filePath, compressed);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("transfer-proofs")
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase.from("ic_orders").insert({
        user_id: user.id,
        email: user.email || "",
        plan: planId,
        transfer_proof_url: urlData.publicUrl,
      } as any);

      if (insertError) throw insertError;

      queryClient.invalidateQueries({ queryKey: ["ic-order-pending"] });
      toast.success("Order submitted! We'll review it soon (◕ᴗ◕✿)");
      navigate("/inner-circle");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-lg px-6 py-12">
          {/* Back button */}
          <button
            onClick={() => navigate("/inner-circle")}
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <h1 className="font-serif text-2xl font-medium tracking-tight">
            Complete Your Order
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {plan.name} — {plan.price}
            <span className="text-xs">{plan.period}</span>
          </p>

          <div className="mt-8 space-y-6">
            {/* User Info (disabled) */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={profile?.username || "—"}
                  disabled
                  className="bg-muted"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user.email || "—"}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>

            {/* QR / Barcode section */}
            <div className="rounded-xl border border-border bg-muted/30 p-6 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
                <QrCode className="h-4 w-4" />
                Scan QRIS untuk Transfer
              </div>
              <div className="mx-auto overflow-hidden rounded-lg border border-border bg-background">
                <img
                  src={qrisImage}
                  alt="QRIS Digital Pustaka Senarasi"
                  className="w-full max-w-xs mx-auto"
                />
              </div>
              <p className="text-sm font-medium">a.n. Digital Pustaka Senarasi</p>
              <p className="text-xs text-muted-foreground">Bisa pembayaran memakai e-wallet apapun</p>
            </div>

            {/* Upload Transfer Proof */}
            <div className="space-y-2">
              <Label>Upload Transfer Proof</Label>
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-muted-foreground/50">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Transfer proof preview"
                    className="max-h-48 rounded-lg object-contain"
                  />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload transfer screenshot
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
              {proofFile && (
                <p className="text-xs text-muted-foreground truncate">
                  {proofFile.name}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => navigate("/inner-circle")}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!proofFile || submitting}
                className="flex-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
              >
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Submit Order"
                )}
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default InnerCirclePayment;
