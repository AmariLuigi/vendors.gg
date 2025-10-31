// Main Middleware for Next.js Application
// Integrates security, authentication, and routing middleware

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';
import { securityMiddleware } from '@/middleware/security';

// Main middleware function
export default withAuth(
  function middleware(request: NextRequest) {
    // Apply security middleware first
    const securityResponse = securityMiddleware(request);
    
    // If security middleware returns a response (e.g., rate limit exceeded), return it
    if (securityResponse.status !== 200) {
      return securityResponse;
    }
    
    // Handle API routes
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return handleApiRoutes(request);
    }
    
    // Handle protected pages
    if (request.nextUrl.pathname.startsWith('/dashboard') || 
        request.nextUrl.pathname.startsWith('/payments') ||
        request.nextUrl.pathname.startsWith('/profile')) {
      return handleProtectedRoutes(request);
    }
    
    // Continue with the request
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Check if user is authenticated for protected routes
        const isProtectedRoute = req.nextUrl.pathname.startsWith('/dashboard') ||
                                req.nextUrl.pathname.startsWith('/payments') ||
                                req.nextUrl.pathname.startsWith('/profile');
        
        const isApiRoute = req.nextUrl.pathname.startsWith('/api/');
        
        // Allow public API routes
        const publicApiRoutes = [
          '/api/auth',
          '/api/health',
          '/api/payments/webhooks', // Webhooks need to be accessible
        ];
        
        if (isApiRoute && publicApiRoutes.some(route => req.nextUrl.pathname.startsWith(route))) {
          return true;
        }
        
        // Require authentication for protected routes and private API routes
        if (isProtectedRoute || (isApiRoute && !publicApiRoutes.some(route => req.nextUrl.pathname.startsWith(route)))) {
          return !!token;
        }
        
        // Allow all other routes
        return true;
      },
    },
  }
);

// Handle API route middleware
function handleApiRoutes(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  
  // Add API-specific headers
  response.headers.set('X-API-Version', '1.0');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  
  // Handle CORS for API routes
  if (request.method === 'OPTIONS') {
    return handleCorsPreflightRequest(request);
  }
  
  // Add CORS headers for actual requests
  addCorsHeaders(response, request);
  
  return response;
}

// Handle protected route middleware
function handleProtectedRoutes(request: NextRequest): NextResponse {
  const response = NextResponse.next();
  
  // Add security headers for protected pages
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}

// Handle CORS preflight requests
function handleCorsPreflightRequest(request: NextRequest): NextResponse {
  const response = new NextResponse(null, { status: 200 });
  
  addCorsHeaders(response, request);
  
  // Add preflight-specific headers
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 hours
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 
    'Content-Type, Authorization, X-Requested-With, Accept, Origin, X-API-Key'
  );
  
  return response;
}

// Add CORS headers to response
function addCorsHeaders(response: NextResponse, request: NextRequest) {
  const origin = request.headers.get('origin');
  
  // Define allowed origins
  const allowedOrigins = [
    process.env.NEXTAUTH_URL,
    'http://localhost:3000',
    'https://localhost:3000',
    // Add your production domains here
  ].filter(Boolean);
  
  // Check if origin is allowed
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Same-origin requests
    response.headers.set('Access-Control-Allow-Origin', '*');
  }
  
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Vary', 'Origin');
}

// Configure which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};