import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/db"
import { registerSchema } from "@/lib/validations/auth"
import { EmailService } from "@/lib/email/email-service"

export async function POST(req: NextRequest) {
  try {
    let body;
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('application/json')) {
      // Handle JSON requests (from React Hook Form)
      body = await req.json()
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // Handle form-encoded requests (from HTML forms)
      const text = await req.text()
      const params = new URLSearchParams(text)
      const phone = params.get('phone')
      body = {
        name: params.get('name') || '',
        email: params.get('email') || '',
        phone: phone && phone.trim() !== '' ? phone : undefined,  // Only include phone if not empty
        password: params.get('password') || ''
      }
    } else {
      // Try to parse as JSON as fallback
      body = await req.json()
    }

    // For debugging, let's temporarily skip validation and see if we can create a user
    const { name, email, phone, password } = body

    // Basic validation
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          ...(phone ? [{ phone }] : [])
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email or phone already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        role: "CUSTOMER"
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true
      }
    })

    // Send welcome email
    try {
      await EmailService.sendWelcomeEmail({
        name: user.name || 'Valued Customer',
        email: user.email
      });
    } catch (emailError) {
      // Log email error but don't fail the registration
      console.error('Failed to send welcome email:', emailError);
    }

    // Check if this is a form submission (vs JSON API call)
    const isFormSubmission = contentType.includes('application/x-www-form-urlencoded');

    if (isFormSubmission) {
      // For HTML form submissions, redirect to login page with success message
      return NextResponse.redirect(new URL('/login?message=Registration successful! Please sign in.', req.url), 302);
    } else {
      // For JSON requests (React Hook Form), return JSON response
      return NextResponse.json(
        { 
          message: "User created successfully",
          user 
        },
        { status: 201 }
      )
    }

  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}