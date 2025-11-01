import { auth } from "@/auth"
import { redirect } from "next/navigation"
import AdminDashboard from "./dashboard-client"

/**
 * Admin Dashboard Page - Chunk 9 Implementation
 * 
 * Features:
 * - Comprehensive analytics and KPIs
 * - Real-time order status board
 * - Sales reports and trends
 * - Customer management insights
 * - Mobile-responsive design
 * - Context7 validated patterns
 */

export default async function AdminPage() {
  const session = await auth()
  
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/")
  }

  return <AdminDashboard user={session.user} />
}