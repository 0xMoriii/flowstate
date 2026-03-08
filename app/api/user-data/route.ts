import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export type UserDataPayload = {
  trades?: unknown[];
  discipline_notes?: Record<string, string>;
  models?: unknown[];
  theme?: string;
  user_has_imported?: boolean;
};

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { data, error } = await supabase
    .from("user_data")
    .select("trades, discipline_notes, models, theme, user_has_imported")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json(
    data ?? {
      trades: [],
      discipline_notes: {},
      models: [],
      theme: null,
      user_has_imported: false,
    }
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  let body: UserDataPayload;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const row = {
    user_id: user.id,
    trades: body.trades ?? [],
    discipline_notes: body.discipline_notes ?? {},
    models: body.models ?? [],
    theme: body.theme ?? null,
    user_has_imported: body.user_has_imported ?? false,
    updated_at: new Date().toISOString(),
  };
  const { error } = await supabase.from("user_data").upsert(row, {
    onConflict: "user_id",
  });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
