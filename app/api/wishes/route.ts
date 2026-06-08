import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const supabase = createClient(supabaseUrl, supabaseKey);

// GET /api/wishes  — fetch approved wishes (or all if ?all=true)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const includeAll = searchParams.get("all") === "true";

  try {
    let query = supabase
      .from("wishes")
      .select("*")
      .order("timestamp", { ascending: false });

    if (!includeAll) {
      query = query.eq("approved", true);
    }

    const { data, error } = await query;

    if (error) {
      console.error("API getWishes error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST /api/wishes  — submit a new wish
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { guestName, message } = body;

    if (!guestName || !message) {
      return NextResponse.json({ error: "Name and message are required" }, { status: 400 });
    }

    if (guestName.length > 20) {
      return NextResponse.json({ error: "Name must be 20 characters or less" }, { status: 400 });
    }

    if (message.length > 300) {
      return NextResponse.json({ error: "Message must be 300 characters or less" }, { status: 400 });
    }

    const wish = {
      id: Math.random().toString(36).substring(2, 11),
      guestName: guestName.trim(),
      message: message.trim(),
      approved: true,
      timestamp: new Date().toISOString(),
      emoji: "❤️",
    };

    const { data, error } = await supabase.from("wishes").insert(wish).select().single();

    if (error) {
      console.error("API submitWish error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? wish, { status: 201 });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
