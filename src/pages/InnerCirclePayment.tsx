import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Upload, Loader2, QrCode, Ticket, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { compressImage } from "@/lib/image-compress";
import qrisImage from "@/assets/qris-digital-pustaka-senarasi.png";

const plans: Record<string, { name: string; price: string; period: string; amount: number }> = {
  yearly: { name: "1 Year", price: "Rp. 99.000", period: "/year", amount: 99000 },
  forever: { name: "Lifetime", price: "Rp. 299.000", period: " one-time", amount: 299000 },
};

const formatRupiah = (val: number) => `Rp. ${val.toLocaleString("id-ID")}`;

const InnerCirclePayment = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan");
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Voucher state
  const [voucherCode, setVoucherCode] = useState("");
  const [voucherApplied, setVoucherApplied] = useState<{
    code: string;
    discount_type: string;
    discount_value: number;
  } | null>(null);
  const [voucherLoading, setVoucherLoading] = useState(false);
  const [voucherError, setVoucherError] = useState("");

  const plan = planId ? plans[planId] : null;

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

  const discountAmount = voucherApplied
    ? voucherApplied.discount_type === "percentage"
      ? Math.round((plan.amount * voucherApplied.discount_value) / 100)
      : Math.min(voucherApplied.discount_value, plan.amount)
    : 0;
  const finalPrice = Math.max(0, plan.amount - discountAmount);

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setVoucherLoading(true);
    setVoucherError("");
    try {
      const { data, error } = await supabase
        .from("vouchers")
        .select("*")
        .eq("code", voucherCode.trim().toUpperCase())
        .eq("is_active", true)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        setVoucherError("Voucher not found or inactive");
        return;
      }
      if (data.max_uses && data.used_count >= data.max_uses) {
        setVoucherError("Voucher has reached its usage limit");
        return;
      }
      setVoucherApplied({
        code: data.code,
        discount_type: data.discount_type,
        discount_value: Number(data.discount_value),
      });
      toast.success("Voucher applied! (◕ᴗ◕✿)");
    } catch (err: any) {
      setVoucherError(err.message || "Failed to validate voucher");
    } finally {
      setVoucherLoading(false);
    }
  };

  const removeVoucher = () => {
    setVoucherApplied(null);
    setVoucherCode("");
    setVoucherError("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setProofFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
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
        voucher_code: voucherApplied?.code || null,
        discount_amount: discountAmount,
        final_price: finalPrice,
      } as any);

      if (insertError) throw insertError;

      // Increment voucher used_count
      if (voucherApplied) {
        await supabase.rpc("increment_voucher_usage" as any, { p_code: voucherApplied.code });
      }

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
            {/* User Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input id="username" value={profile?.username || "—"} disabled className="bg-muted" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={user.email || "—"} disabled className="bg-muted" />
              </div>
            </div>

            {/* QR / QRIS */}
            <div className="rounded-xl border border-border bg-muted/30 p-6 text-center space-y-3">
              <div className="flex items-center justify-center gap-2 text-sm font-medium text-foreground">
                <QrCode className="h-4 w-4" />
                Scan QRIS to Pay
              </div>
              <div className="mx-auto overflow-hidden rounded-lg border border-border bg-background">
                <img
                  src={qrisImage}
                  alt="QRIS Digital Pustaka Senarasi"
                  className="w-full max-w-xs mx-auto"
                />
              </div>
              <p className="text-sm font-medium">a.n. Digital Pustaka Senarasi</p>
              <p className="text-xs text-muted-foreground">You can pay using any e-wallet</p>
            </div>

            {/* Voucher Section */}
            <div className="space-y-2">
              <Label className="flex items-center gap-1.5">
                <Ticket className="h-3.5 w-3.5" />
                Voucher Code
              </Label>
              {voucherApplied ? (
                <div className="flex items-center justify-between rounded-lg border border-[hsl(140,50%,75%)] bg-[hsl(140,50%,95%)] px-3 py-2.5">
                  <div>
                    <code className="text-sm font-medium">{voucherApplied.code}</code>
                    <p className="text-xs text-[hsl(140,50%,30%)]">
                      -{voucherApplied.discount_type === "percentage"
                        ? `${voucherApplied.discount_value}%`
                        : formatRupiah(voucherApplied.discount_value)
                      } discount applied!
                    </p>
                  </div>
                  <button onClick={removeVoucher} className="text-muted-foreground hover:text-foreground">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={voucherCode}
                    onChange={(e) => { setVoucherCode(e.target.value.toUpperCase()); setVoucherError(""); }}
                    placeholder="Enter voucher code"
                    className="font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleApplyVoucher}
                    disabled={voucherLoading || !voucherCode.trim()}
                    className="flex-shrink-0"
                  >
                    {voucherLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                  </Button>
                </div>
              )}
              {voucherError && (
                <p className="text-xs text-destructive">{voucherError}</p>
              )}
            </div>

            {/* Price Summary */}
            {voucherApplied && (
              <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-1.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Original price</span>
                  <span>{plan.price}</span>
                </div>
                <div className="flex justify-between text-[hsl(140,50%,40%)]">
                  <span>Discount ({voucherApplied.code})</span>
                  <span>-{formatRupiah(discountAmount)}</span>
                </div>
                <div className="border-t border-border pt-1.5 flex justify-between font-medium">
                  <span>Total</span>
                  <span>{formatRupiah(finalPrice)}</span>
                </div>
              </div>
            )}

            {/* Upload Transfer Proof */}
            <div className="space-y-2">
              <Label>Upload Transfer Proof</Label>
              <label className="flex cursor-pointer flex-col items-center gap-2 rounded-xl border-2 border-dashed border-border p-6 transition-colors hover:border-muted-foreground/50">
                {previewUrl ? (
                  <img src={previewUrl} alt="Transfer proof preview" className="max-h-48 rounded-lg object-contain" />
                ) : (
                  <>
                    <Upload className="h-6 w-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Click to upload transfer screenshot</span>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              </label>
              {proofFile && (
                <p className="text-xs text-muted-foreground truncate">{proofFile.name}</p>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => navigate("/inner-circle")} className="flex-1">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!proofFile || submitting}
                className="flex-1 bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))]"
              >
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Order"}
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
