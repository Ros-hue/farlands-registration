import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkRateLimit, RATE_LIMITS, type RateLimitConfig } from "@/lib/edge-limiter";

function getClientIp(request: NextRequest): string {
  return request.headers.get("cf-connecting-ip")?.trim()
    ?? request.headers.get("x-real-ip")?.trim()
    ?? request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? "unknown";
}

function getRateLimitTier(path: string): { config: RateLimitConfig; keyPrefix: string } | null {
  if (path === "/api/auth/login") return { config: RATE_LIMITS.auth, keyPrefix: "auth" };
  if (path === "/api/registration") return { config: RATE_LIMITS.registration, keyPrefix: "reg" };
  if (path.startsWith("/api/payments/")) return { config: RATE_LIMITS.payment, keyPrefix: "pay" };
  if (path.startsWith("/api/admin/")) return { config: RATE_LIMITS.admin, keyPrefix: "admin" };
  if (path.startsWith("/api/")) return { config: RATE_LIMITS.general, keyPrefix: "gen" };
  return null;
}

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // --- Defense-in-depth auth guard ---
  // Fast-reject unauthenticated admin requests at edge if no Bearer token or cookie is provided
  if (path.startsWith("/api/admin/")) {
    const authHeader = request.headers.get("authorization");
    const hasBearer = Boolean(authHeader?.startsWith("Bearer ") && authHeader.length >= 20);
    const accessCookie = request.cookies.get("__Host-farlands-access")
      ?? request.cookies.get("farlands-access");
    if (!hasBearer && !accessCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Fast-reject participant payment proof requests if no credentials
  if (
    path.startsWith("/api/payments/submit-proof") ||
    path.startsWith("/api/payments/status") ||
    path.startsWith("/api/payments/proof/")
  ) {
    const authHeader = request.headers.get("authorization");
    const hasBearer = Boolean(authHeader?.startsWith("Bearer ") && authHeader.length >= 20);
    const accessCookie = request.cookies.get("__Host-farlands-access")
      ?? request.cookies.get("farlands-access");
    if (!hasBearer && !accessCookie?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // --- Rate limiting ---
  const tier = getRateLimitTier(path);
  if (tier) {
    const identifier = getClientIp(request);
    const result = checkRateLimit(`${tier.keyPrefix}:${identifier}`, tier.config);
    if (!result.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(result.retryAfterSeconds) },
        },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
