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
    <div className="rounded-lg border-2 border-red-300 bg-red-50 p-4">
      <p className="mb-3 text-sm font-medium text-red-800">
        You must check out to submit this visit. No edits allowed after checkout.
      </p>
      <Button
        variant="destructive"
        className="w-full"
        onClick={handleCheckout}
        disabled={loading}
      >
        <LogOut className="mr-2 h-4 w-4" />
        {loading ? "Submitting..." : "Check Out & Submit"}
      </Button>
    </div>
  );
}
