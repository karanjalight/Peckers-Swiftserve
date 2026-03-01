"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateVisitNotes } from "@/app/mr/actions";
import { Button } from "@/components/ui/button";

export function MrVisitNotesForm({
  visitId,
  initialNotes,
}: {
  visitId: string;
  initialNotes: string | null;
}) {
  const router = useRouter();
  const [notes, setNotes] = useState(initialNotes ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSave() {
    setSaving(true);
    setMessage("");
    const result = await updateVisitNotes(visitId, notes);
    setSaving(false);
    if (result.success) {
      setMessage("Notes saved.");
      router.refresh();
    } else {
      setMessage(result.error ?? "Failed to save");
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5 dark:bg-card dark:ring-white/10">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-foreground">Visit notes</h3>
      <p className="mt-1 mb-4 text-sm text-slate-600 dark:text-muted-foreground">
        Add or update notes from this visit: products discussed, stock availability, competitor products, or any other observations. These notes are visible to managers and admins.
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        className="w-full rounded-2xl bg-white dark:bg-background shadow-sm ring-1 ring-black/5 dark:ring-white/10 px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500/30 transition"
        placeholder="Add notes..."
      />
      <div className="mt-3 flex items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={handleSave}
          disabled={saving}
          className="rounded-2xl cta-gradient"
        >
          {saving ? "Saving…" : "Save notes"}
        </Button>
        {message && (
          <span className={`text-sm ${message === "Notes saved." ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
