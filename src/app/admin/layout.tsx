import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import AdminSidebar from '@/components/admin/AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
}

/**
 * Admin Layout Component
 * 
 * Provides:
 * - Authentication check for admin users
 * - Consistent sidebar navigation
 * - Responsive layout for admin interface
 * - Role-based access control
 */

export default async function AdminLayout({ children }: AdminLayoutProps) {
  const session = await auth();

  // Redirect non-authenticated users
  if (!session?.user) {
    redirect('/admin/login');
  }

  // Redirect non-admin users
  if (session.user.role !== 'ADMIN') {
    redirect('/');
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <AdminSidebar />
      
      {/* Main Content */}
      <div className="flex-1 lg:ml-64">
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}