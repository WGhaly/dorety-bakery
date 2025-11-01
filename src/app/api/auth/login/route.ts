import { NextRequest, NextResponse } from "next/server"
import { signIn } from "@/auth"
import { AuthError } from "next-auth"

export async function POST(req: NextRequest) {
  try {
    let body;
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/x-www-form-urlencoded')) {
      // Handle form-encoded requests (from HTML forms)
      const text = await req.text()
      const params = new URLSearchParams(text)
      body = {
        email: params.get('email') || '',
        password: params.get('password') || '',
        callbackUrl: params.get('callbackUrl') || '/dashboard'
      }
    } else {
      // Handle JSON requests 
      body = await req.json()
    }

    const { email, password, callbackUrl } = body

    // Basic validation
    if (!email || !password) {
      const redirectUrl = new URL('/login', req.url)
      redirectUrl.searchParams.set('error', 'Missing email or password')
      return NextResponse.redirect(redirectUrl, 302)
    }

    try {
      // Use NextAuth's signIn function on the server
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        const redirectUrl = new URL('/login', req.url)
        redirectUrl.searchParams.set('error', 'Invalid email or password')
        return NextResponse.redirect(redirectUrl, 302)
      }

      // Successful login - redirect to dashboard or callback URL
      return NextResponse.redirect(new URL(callbackUrl, req.url), 302)

    } catch (error) {
      console.error("SignIn error:", error)
      
      if (error instanceof AuthError) {
        const redirectUrl = new URL('/login', req.url)
        redirectUrl.searchParams.set('error', 'Invalid email or password')
        return NextResponse.redirect(redirectUrl, 302)
      }
      
      throw error
    }

  } catch (error) {
    console.error("Login error:", error)
    const redirectUrl = new URL('/login', req.url)
    redirectUrl.searchParams.set('error', 'Something went wrong')
    return NextResponse.redirect(redirectUrl, 302)
  }
}