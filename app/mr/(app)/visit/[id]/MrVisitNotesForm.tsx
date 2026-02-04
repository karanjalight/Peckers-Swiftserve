"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateVisitNotes } from "@/app/mr/actions";

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
    <div className="rounded-xl border bg-white p-5">
      <h3 className="text-lg font-semibold text-slate-900">Visit notes</h3>
      <p className="mt-1 mb-4 text-sm text-slate-500">
        Add or update notes from this visit: products discussed, stock availability, competitor products, or any other observations. These notes are visible to managers and admins.
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={4}
        className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
        placeholder="Add notes..."
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save notes"}
        </button>
        {message && (
          <span className={`text-sm ${message === "Notes saved." ? "text-green-600" : "text-red-600"}`}>
            {message}
          </span>
        )}
      </div>
    </div>
  );
}
