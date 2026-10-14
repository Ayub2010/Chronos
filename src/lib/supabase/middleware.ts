import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabasePublicConfig } from "./config";

const DEMO_COOKIE = "chronos-demo";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const config = getSupabasePublicConfig();
  const isDemo = request.cookies.get(DEMO_COOKIE)?.value === "1";

  let signedIn = isDemo;

  if (config) {
    const supabase = createServerClient(config.url, config.key, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
          if (headers) {
            for (const [key, value] of Object.entries(headers)) {
              supabaseResponse.headers.set(key, String(value));
            }
          }
        },
      },
    });

    const { data } = await supabase.auth.getClaims();
    signedIn = Boolean(data?.claims) || isDemo;
  }

  const path = request.nextUrl.pathname;

  if (!signedIn && path.startsWith("/app")) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  if (signedIn && path === "/auth") {
    const url = request.nextUrl.clone();
    url.pathname = "/app";
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach((cookie) => {
      redirectResponse.cookies.set(cookie);
    });
    return redirectResponse;
  }

  return supabaseResponse;
}
