"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Image, Settings } from "lucide-react";

const cmsNavigation = [
  {
    name: "Pages",
    href: "/admin/cms/pages",
    icon: FileText,
    description: "Manage website pages and content"
  },
  {
    name: "Banners",
    href: "/admin/cms/banners", 
    icon: Image,
    description: "Manage promotional banners"
  },
];

export default function CMSNavigation() {
  const pathname = usePathname();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Content Management</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cmsNavigation.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`p-4 rounded-lg border transition-colors ${
                isActive
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-gray-200 hover:border-amber-200 hover:bg-amber-50"
              }`}
            >
              <div className="flex items-start space-x-3">
                <Icon className={`h-6 w-6 mt-1 ${
                  isActive ? "text-amber-600" : "text-gray-400"
                }`} />
                <div>
                  <h3 className="font-medium">{item.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}