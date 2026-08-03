import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options?: CookieOptions };

export async function updateSession(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAuthPage =
    pathname === "/" ||
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup");
  const isApprovalPage = pathname.startsWith("/permission-approval");
  const isAuthCallback = pathname.startsWith("/auth/");
  const isProtected =
    pathname.startsWith("/leads") ||
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/admin");

  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("approval_status, is_system_admin")
      .eq("id", user.id)
      .single();

    const isApproved =
      profile?.is_system_admin || profile?.approval_status === "approved";
    const isWaitingForApproval =
      profile?.approval_status === "pending" ||
      profile?.approval_status === "pending_on_hold";
    const isRejected = profile?.approval_status === "rejected";

    if ((isWaitingForApproval || isRejected) && !isApprovalPage && !isAuthCallback) {
      const url = request.nextUrl.clone();
      url.pathname = "/permission-approval";
      return NextResponse.redirect(url);
    }

    if (isApproved && isApprovalPage) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    if (user && isAuthPage && isApproved) {
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    if (user && isAuthPage && (isWaitingForApproval || isRejected)) {
      const url = request.nextUrl.clone();
      url.pathname = "/permission-approval";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
