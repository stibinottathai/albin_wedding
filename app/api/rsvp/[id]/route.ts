import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// PATCH /api/rsvp/[id]  — submit or update RSVP for a guest
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { rsvpStatus, rsvpAttendees, rsvpMessage } = body;

    if (!rsvpStatus || !["accepted", "declined"].includes(rsvpStatus)) {
      return NextResponse.json({ error: "Invalid rsvpStatus" }, { status: 400 });
    }

    const updatedAt = new Date().toISOString();

    const { error } = await supabase
      .from("guests")
      .update({ rsvpStatus, rsvpAttendees, rsvpMessage, updatedAt })
      .eq("id", id);

    if (error) {
      console.error("API updateRSVP error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// GET /api/rsvp/[id]  — get a single guest record
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
