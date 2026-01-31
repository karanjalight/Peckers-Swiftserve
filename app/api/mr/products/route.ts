import { NextResponse } from "next/server";
import { getMrAuth } from "@/lib/mr/supabase-server";

export async function GET() {
  const auth = await getMrAuth();
  if (auth.error) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const { data, error } = await auth.supabase
    .from("mr_products")
    .select("id, name")
    .order("name");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ products: data ?? [] });
}
