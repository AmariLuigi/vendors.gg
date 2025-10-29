import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Add any additional middleware logic here
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Allow access to auth pages when not logged in
        if (pathname.startsWith('/auth/')) {
          return true;
        }

        // Protect dashboard routes
        if (pathname.startsWith('/dashboard/')) {
          return !!token;
        }

        // Protect chat routes
        if (pathname.startsWith('/chat')) {
          return !!token;
        }

        // Protect API routes that require authentication
        if (pathname.startsWith('/api/conversations') || 
            pathname.startsWith('/api/messages') ||
            pathname.startsWith('/api/listings/create') ||
            pathname.startsWith('/api/listings/update')) {
          return !!token;
        }

        // Allow all other routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/chat/:path*',
    '/api/conversations/:path*',
    '/api/messages/:path*',
    '/api/listings/create/:path*',
    '/api/listings/update/:path*',
  ],
};