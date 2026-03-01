"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { mrCheckOut } from "@/app/mr/actions";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function MrCheckoutButton({ visitId }: { visitId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCheckout() {
    if (!confirm("Check out and submit this visit? You cannot edit it afterward.")) return;
    setLoading(true);
    const result = await mrCheckOut(visitId);
    setLoading(false);
    if (result.success) {
      router.push("/mr/history");
      router.refresh();
    } else {
      alert(result.error ?? "Checkout failed");
    }
  }

  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5 dark:bg-card dark:ring-white/10">
      <p className="mb-3 text-sm font-medium text-slate-900 dark:text-foreground">
        You must check out to submit this visit. No edits allowed after checkout.
      </p>
      <Button
        className="w-full rounded-2xl cta-gradient min-h-12"
        onClick={handleCheckout}
        disabled={loading}
      >
        <LogOut className="mr-2 h-4 w-4" />
        {loading ? "Submitting..." : "Check Out & Submit"}
      </Button>
    </div>
  );
}
