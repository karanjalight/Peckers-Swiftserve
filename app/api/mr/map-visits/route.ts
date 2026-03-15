import { NextResponse } from "next/server";
import { getMrAuth } from "@/lib/mr/supabase-server";

export type MapVisit = {
  id: string;
  gps_lat: number;
  gps_lng: number;
  check_in_time: string | null;
  check_out_time: string | null;
  visit_duration_minutes: number | null;
  status: string;
  objective: string | null;
  pharmacy_name: string;
  pharmacy_region: string | null;
  mr_name: string | null;
};

export async function GET() {
  const auth = await getMrAuth();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }
  const isManagerOrAdmin = auth.profile.role === "MANAGER" || auth.profile.role === "ADMIN";
  if (!isManagerOrAdmin) {
    return NextResponse.json({ error: "Manager or Admin required" }, { status: 403 });
  }

  const { supabase } = auth;

  const { data: visits, error } = await supabase
    .from("mr_visits")
    .select(
      "id, gps_lat, gps_lng, check_in_time, check_out_time, visit_duration_minutes, status, objective, mr_pharmacies(name, region), mr_profiles!mr_id(full_name)"
    )
    .not("gps_lat", "is", null)
    .not("gps_lng", "is", null)
    .order("check_in_time", { ascending: false })
    .limit(2000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const list: MapVisit[] = (visits ?? []).map((v: Record<string, unknown>) => {
    const ph = Array.isArray(v.mr_pharmacies) ? v.mr_pharmacies[0] : v.mr_pharmacies;
    const mr = Array.isArray(v.mr_profiles) ? v.mr_profiles[0] : v.mr_profiles;
    return {
      id: v.id as string,
      gps_lat: Number(v.gps_lat),
      gps_lng: Number(v.gps_lng),
      check_in_time: (v.check_in_time as string) ?? null,
      check_out_time: (v.check_out_time as string) ?? null,
      visit_duration_minutes: (v.visit_duration_minutes as number) ?? null,
      status: (v.status as string) ?? "OPEN",
      objective: (v.objective as string) ?? null,
      pharmacy_name: (ph as { name?: string })?.name ?? "Pharmacy",
      pharmacy_region: (ph as { region?: string | null })?.region ?? null,
      mr_name: (mr as { full_name?: string | null })?.full_name ?? null,
    };
  });

  return NextResponse.json({ visits: list });
}
