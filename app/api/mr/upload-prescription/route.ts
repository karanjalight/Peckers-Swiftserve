import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BUCKET = "mr-prescription-images";

export async function POST(req: NextRequest) {
  try {
    const accessToken = req.cookies.get("sb-auth-token")?.value;
    if (!accessToken) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    });

    const { data: { user } } = await supabase.auth.getUser(accessToken);
    if (!user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const visitId = formData.get("visitId") as string | null;

    if (!file || !visitId) {
      return NextResponse.json(
        { error: "Missing file or visitId" },
        { status: 400 }
      );
    }

    // Verify visit belongs to user and is OPEN
    const { data: visit } = await supabase
      .from("mr_visits")
      .select("id, mr_id, status")
      .eq("id", visitId)
      .single();

    if (!visit || visit.mr_id !== user.id || visit.status !== "OPEN") {
      return NextResponse.json(
        { error: "Invalid or closed visit" },
        { status: 403 }
      );
    }

    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${visitId}/${crypto.randomUUID()}.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data, error } = await supabase.storage
      .from(BUCKET)
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(data.path);

    // Store path in DB; use /api/mr/signed-url to get viewable URL for private bucket
    return NextResponse.json({
      path: data.path,
      storagePath: `mr-prescription-images/${data.path}`,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
