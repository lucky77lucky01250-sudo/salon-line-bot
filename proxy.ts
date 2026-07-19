import { NextResponse, type NextRequest } from "next/server";

// /admin 配下をBasic認証で保護する（パスワードは env ADMIN_PASSWORD）
// ユーザー名は使わない（何を入れてもよい）
export function proxy(request: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;
  const authHeader = request.headers.get("authorization");

  if (password && authHeader?.startsWith("Basic ")) {
    const decoded = atob(authHeader.slice("Basic ".length));
    const inputPassword = decoded.slice(decoded.indexOf(":") + 1);
    if (inputPassword === password) {
      return NextResponse.next();
    }
  }

  // 未設定時も含めて拒否（fail closed）
  return new NextResponse("認証が必要です", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="salon-admin"' },
  });
}

export const config = {
  matcher: "/admin/:path*",
};
