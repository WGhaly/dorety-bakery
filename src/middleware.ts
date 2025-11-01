import { auth } from "@/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Define protected routes
const protectedRoutes = [
  "/dashboard",
  "/admin",
  "/profile",
  "/orders",
  "/cart"
]

// Define admin-only routes
const adminRoutes = [
  "/admin"
]

// Define auth routes (redirect if logged in)
const authRoutes = [
  "/login",
  "/register"
]

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth

  const isAuthRoute = authRoutes.includes(nextUrl.pathname)
  const isProtectedRoute = protectedRoutes.some((route: string) => 
    nextUrl.pathname.startsWith(route)
  )

  // Temporarily disable auth redirects for testing
  console.log("Middleware debug:", {
    pathname: nextUrl.pathname,
    isLoggedIn,
    isAuthRoute,
    isProtectedRoute,
    auth: req.auth
  })

  // Comment out auth route redirects for testing
  // if (isAuthRoute && isLoggedIn) {
  //   return Response.redirect(new URL("/dashboard", nextUrl))
  // }

  // Redirect unauthenticated users to login for protected routes
  if (isProtectedRoute && !isLoggedIn) {
    return Response.redirect(new URL("/login", nextUrl))
  }

  // Allow all other routes
  return null
})

// Configure middleware to run on specific paths
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ]
}