import type { PostgrestError } from "@supabase/supabase-js";
import { MR_SUPABASE_MAX_ROWS } from "./supabase-limits";

/**
 * Fetches all rows by paging with .range(from, to) in chunks of MR_SUPABASE_MAX_ROWS.
 * Accepts PromiseLike (Supabase builders are thenable, not typed as Promise).
 */
export async function fetchAllByRange<T>(
  run: (
    from: number,
    to: number
  ) => PromiseLike<{ data: T[] | null; error: PostgrestError | null }>
): Promise<{ data: T[]; error: PostgrestError | null }> {
  const out: T[] = [];
  let from = 0;
  const size = MR_SUPABASE_MAX_ROWS;
  while (true) {
    const to = from + size - 1;
    const { data, error } = await Promise.resolve(run(from, to));
    if (error) {
      return { data: out, error };
    }
    const chunk = data ?? [];
    out.push(...chunk);
    if (chunk.length < size) break;
    from += size;
  }
  return { data: out, error: null };
}
