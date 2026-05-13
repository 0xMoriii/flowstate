import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";
  const redirectTo = next.startsWith("/") ? next : "/";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    return NextResponse.redirect(`${origin}/?auth_error=1`);
  }

  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocalEnv = process.env.NODE_ENV === "development";
  const redirectUrl = isLocalEnv
    ? `${origin}${redirectTo}`
    : forwardedHost
      ? `https://${forwardedHost}${redirectTo}`
      : `${origin}${redirectTo}`;

  // Build redirect response first so we can attach session cookies to it
  let response = NextResponse.redirect(redirectUrl);

  if (code) {
    const supabase = createServerClient(url, key, {
      cookies: {
        getAll() {
          const cookieHeader = request.headers.get("cookie");
          if (!cookieHeader) return [];
          return cookieHeader.split(";").map((c) => {
            const eq = c.trim().indexOf("=");
            if (eq <= 0) return { name: "", value: "" };
            return { name: c.trim().slice(0, eq).trim(), value: c.trim().slice(eq + 1).trim() };
          }).filter((c) => c.name);
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const opts = typeof options === "object" && options !== null ? { ...options } : {};
            response.cookies.set(name, value, {
              path: "/",
              secure: process.env.NODE_ENV === "production",
              sameSite: "lax",
              ...opts,
            });
          });
        },
      },
    });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      response = NextResponse.redirect(`${origin}/?auth_error=1`);
    }
  } else {
    response = NextResponse.redirect(`${origin}/?auth_error=1`);
  }

  return response;
}
