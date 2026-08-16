import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";

const PROTECTED_PREFIXES = ["/owner", "/admin"];
const LOCALE_PREFIX_PATTERN = /^\/(en|fr|uk)(?=\/|$)/;

const handleIntl = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const intlResponse = handleIntl(request);

  // A 3xx here means next-intl decided to redirect (e.g. to add a locale
  // prefix) — honor that immediately, the Supabase session below only
  // matters once we're on the actual page being served.
  if (intlResponse.status >= 300 && intlResponse.status < 400) {
    return intlResponse;
  }

  let response = intlResponse;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const localeMatch = request.nextUrl.pathname.match(LOCALE_PREFIX_PATTERN);
  const localePrefix = localeMatch ? localeMatch[0] : "";
  const pathWithoutLocale = localePrefix
    ? request.nextUrl.pathname.slice(localePrefix.length) || "/"
    : request.nextUrl.pathname;

  const isProtected = PROTECTED_PREFIXES.some((p) => pathWithoutLocale.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = `${localePrefix}/login`;
    // "next" is always stored locale-neutral (no prefix) — LoginForm.tsx
    // pushes it back through the locale-aware router, which re-adds the
    // current locale's prefix itself.
    url.searchParams.set("next", pathWithoutLocale);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api).*)"],
};
