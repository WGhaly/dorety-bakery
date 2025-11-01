/**
 * Enhanced Customer Dashboard - Chunk 8 Implementation
 * Following Context7 best practices for customer portal design
 */

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import CustomerDashboardClient from "./page-client"

export default async function DashboardPage() {
  const session = await auth()
  
  if (!session?.user) {
    redirect("/login?redirect=/dashboard")
  }

  // Redirect admin users to admin dashboard
  if (session.user.role === 'ADMIN') {
    redirect("/admin")
  }

  return <CustomerDashboardClient />
}