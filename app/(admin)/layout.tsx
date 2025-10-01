import { ReactNode } from 'react';
import { Toaster } from 'sonner';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav role="navigation" aria-label="Admin navigation" className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
            <div className="flex items-center gap-4">
              <a href="/admin/orders" className="text-gray-600 hover:text-gray-900">
                Orders
              </a>
              <a href="/admin/products" className="text-gray-600 hover:text-gray-900">
                Products
              </a>
              <a href="/admin" className="text-gray-600 hover:text-gray-900">
                Dashboard
              </a>
            </div>
          </div>
        </div>
      </nav>
      
      <main role="main">
        {children}
      </main>
      
      <Toaster position="top-right" />
    </div>
  );
}
