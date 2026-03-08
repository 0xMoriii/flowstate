import { NextResponse } from "next/server";
import { createClientForRouteHandler, setCookiesOnResponse } from "@/lib/supabase/route-handler";

export type UserDataPayload = {
  trades?: unknown[];
  discipline_notes?: Record<string, string>;
  models?: unknown[];
  theme?: string;
  user_has_imported?: boolean;
};

export async function GET(request: Request) {
  const { supabase, cookiesToSet } = createClientForRouteHandler(request);
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
  const payload = data ?? {
    trades: [],
    discipline_notes: {},
    models: [],
    theme: null,
    user_has_imported: false,
  };
  const response = NextResponse.json({
    user: { id: user.id, email: user.email ?? undefined },
    ...payload,
  });
  setCookiesOnResponse(response, cookiesToSet);
  return response;
}

export async function POST(request: Request) {
  const { supabase, cookiesToSet } = createClientForRouteHandler(request);
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
  const response = NextResponse.json({ ok: true });
  setCookiesOnResponse(response, cookiesToSet);
  return response;
}
