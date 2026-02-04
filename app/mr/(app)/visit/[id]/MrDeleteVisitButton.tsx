"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteVisit } from "@/app/mr/actions";

export function MrDeleteVisitButton({
  visitId,
  redirectTo,
  variant = "outline",
  size = "sm",
  className,
}: {
  visitId: string;
  redirectTo: string;
  variant?: "outline" | "ghost" | "destructive" | "link" | "default" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}) {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (
      !confirm(
        "Delete this entire visit and all its audit data? This cannot be undone."
      )
    )
      return;
    setDeleting(true);
    const res = await deleteVisit(visitId);
    setDeleting(false);
    if (res.success) {
      router.push(redirectTo);
      router.refresh();
    } else {
      alert(res.error ?? "Failed to delete visit");
    }
  }

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className ?? "gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"}
      disabled={deleting}
      onClick={handleDelete}
    >
      {deleting ? "Deleting…" : <Trash2 className="h-4 w-4" />}
      Delete visit
    </Button>
  );
}
