import { NextResponse } from "next/server";
import { createClientForRouteHandler, setCookiesOnResponse } from "@/lib/supabase/route-handler";

export type UserDataPayload = {
  trades?: unknown[];
  discipline_notes?: Record<string, string>;
  models?: unknown[];
  theme?: string;
  user_has_imported?: boolean;
  import_templates?: unknown[];
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
    .select("trades, discipline_notes, models, theme, user_has_imported, import_templates")
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
    import_templates: [],
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
  // Partial update: only write the columns the client actually sent. Lets the client save
  // theme alone without re-uploading the full trades blob (which can include base64 images).
  const updatedAt = new Date().toISOString();
  const updates: Record<string, unknown> = { updated_at: updatedAt };
  if (body.trades !== undefined) updates.trades = body.trades;
  if (body.discipline_notes !== undefined) updates.discipline_notes = body.discipline_notes;
  if (body.models !== undefined) updates.models = body.models;
  if (body.theme !== undefined) updates.theme = body.theme;
  if (body.user_has_imported !== undefined) updates.user_has_imported = body.user_has_imported;
  if (body.import_templates !== undefined) updates.import_templates = body.import_templates;

  const { data: existing, error: selectError } = await supabase
    .from("user_data")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  const error = existing
    ? (await supabase.from("user_data").update(updates).eq("user_id", user.id)).error
    : (await supabase.from("user_data").insert({
        user_id: user.id,
        trades: body.trades ?? [],
        discipline_notes: body.discipline_notes ?? {},
        models: body.models ?? [],
        theme: body.theme ?? null,
        user_has_imported: body.user_has_imported ?? false,
        import_templates: body.import_templates ?? [],
        updated_at: updatedAt,
      })).error;
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const response = NextResponse.json({ ok: true });
  setCookiesOnResponse(response, cookiesToSet);
  return response;
}
