import { auth } from "@/auth"
import { redirect } from "next/navigation"

export default async function ReportsPage() {
  const session = await auth()
  
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600">Comprehensive business reports and insights.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Sales Reports */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <h3 className="text-lg font-medium text-gray-900">Sales Reports</h3>
              <p className="text-sm text-gray-500">Revenue and sales analytics</p>
            </div>
          </div>
          <div className="mt-4">
            <a
              href="/admin/finance/reports"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              View Sales Reports →
            </a>
          </div>
        </div>

        {/* Customer Reports */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <h3 className="text-lg font-medium text-gray-900">Customer Reports</h3>
              <p className="text-sm text-gray-500">Customer analytics and insights</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-gray-500 text-sm">Coming soon...</p>
          </div>
        </div>

        {/* Inventory Reports */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <h3 className="text-lg font-medium text-gray-900">Inventory Reports</h3>
              <p className="text-sm text-gray-500">Stock levels and product analytics</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-gray-500 text-sm">Coming soon...</p>
          </div>
        </div>

        {/* Order Reports */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <h3 className="text-lg font-medium text-gray-900">Order Reports</h3>
              <p className="text-sm text-gray-500">Order patterns and delivery analytics</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-gray-500 text-sm">Coming soon...</p>
          </div>
        </div>

        {/* Financial Reports */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <h3 className="text-lg font-medium text-gray-900">Financial Reports</h3>
              <p className="text-sm text-gray-500">Detailed financial analytics</p>
            </div>
          </div>
          <div className="mt-4">
            <a
              href="/admin/finance"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              View Financial Reports →
            </a>
          </div>
        </div>

        {/* Export Tools */}
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-gray-500 rounded-md flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <h3 className="text-lg font-medium text-gray-900">Export Tools</h3>
              <p className="text-sm text-gray-500">Download reports as PDF/Excel</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-gray-500 text-sm">Coming soon...</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors">
            Generate Daily Report
          </button>
          <button className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded transition-colors">
            Weekly Summary
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded transition-colors">
            Monthly Report
          </button>
          <button className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded transition-colors">
            Custom Report
          </button>
        </div>
      </div>
    </div>
  )
}