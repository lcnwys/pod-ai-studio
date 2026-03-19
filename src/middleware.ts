import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Inject user ID into headers for API routes
    const token = req.nextauth.token;
    if (token?.userId) {
      const headers = new Headers(req.headers);
      headers.set('x-user-id', token.userId as string);
      return NextResponse.next({
        request: { headers },
      });
    }
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow public routes
        const { pathname } = req.nextUrl;
        if (
          pathname.startsWith('/login') ||
          pathname.startsWith('/register') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/callback') || // ChcyAI callback (external)
          pathname === '/'
        ) {
          return true;
        }
        // Require auth for everything else
        return !!token;
      },
    },
  },
);

export const config = {
  matcher: [
    // Match all routes except static files and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
