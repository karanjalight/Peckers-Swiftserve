/**
 * Must match Supabase Dashboard → Project Settings → API → Max rows.
 * Used for .limit() / .range() page sizes so requests stay within PostgREST limits.
 */
export const MR_SUPABASE_MAX_ROWS = 2000;

/** Max UUIDs per `.in("id", …)` batch to stay under URL / PostgREST limits */
export const MR_SUPABASE_IN_CHUNK = 200;
