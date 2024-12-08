import { NextResponse } from 'next/server';

export async function middleware(req) {
  const token = req.cookies.get('auth-token');

  // List of paths that don't require authentication
  const publicPaths = [
    '/login', 
    '/api/auth/login'
  ];

  // List of API paths that need token
  const apiPaths = [
    '/api/mongo-issues'
  ];

  // List of protected pages
  const protectedPaths = [
    '/',
    '/mongo'
  ];
  
  const path = req.nextUrl.pathname;

  // Allow public paths
  if (publicPaths.includes(path)) {
    return NextResponse.next();
  }

  // Check auth for API paths
  if (apiPaths.includes(path)) {
    if (!token) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    return NextResponse.next();
  }

  // Check auth for protected pages
  if (protectedPaths.includes(path) && !token) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
