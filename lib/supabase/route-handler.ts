import { createServerClient } from "@supabase/ssr";

type CookieEntry = { name: string; value: string; options?: Record<string, unknown> };

/**
 * Create a Supabase server client for Route Handlers that reads cookies from the request
 * and collects any cookies Supabase wants to set (e.g. refreshed session) so you can
 * attach them to your response. This ensures the client receives updated session cookies
 * even when the route returns JSON (middleware's response is replaced by the route's).
 */
export function createClientForRouteHandler(request: Request) {
  const cookiesToSet: CookieEntry[] = [];
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Missing Supabase env vars");
  }

  function parseCookieHeader(header: string | null): { name: string; value: string }[] {
    if (!header) return [];
    return header.split(";").map((c) => {
      const eq = c.trim().indexOf("=");
      if (eq <= 0) return { name: "", value: "" };
      return { name: c.trim().slice(0, eq).trim(), value: c.trim().slice(eq + 1).trim() };
    }).filter((c) => c.name);
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return parseCookieHeader(request.headers.get("cookie"));
      },
      setAll(cookies: CookieEntry[]) {
        cookies.forEach((c) => cookiesToSet.push(c));
      },
    },
  });

  return { supabase, cookiesToSet };
}

/** Normalize cookie options and set on response so client receives session cookies. */
export function setCookiesOnResponse(
  response: { cookies: { set: (name: string, value: string, opts?: Record<string, unknown>) => void } },
  cookiesToSet: CookieEntry[]
): void {
  cookiesToSet.forEach(({ name, value, options }) => {
    const opts: Record<string, unknown> = {
      path: "/",
      ...(typeof options === "object" && options !== null ? options : {}),
    };
    const sameSite = opts.sameSite as string | undefined;
    if (sameSite && !["lax", "strict", "none"].includes(String(sameSite).toLowerCase())) {
      opts.sameSite = "lax";
    }
    response.cookies.set(name, value, opts);
  });
}
