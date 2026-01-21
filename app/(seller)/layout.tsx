import { ReactNode } from 'react';
import { Toaster } from 'sonner';

interface SellerLayoutProps {
  children: ReactNode;
}

export default function SellerLayout({ children }: SellerLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav role="navigation" aria-label="Seller navigation" className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">Seller Dashboard</h1>
            <div className="flex items-center gap-4">
              <a href="/seller/orders" className="text-gray-600 hover:text-gray-900">
                Orders
              </a>
              <a href="/seller/products" className="text-gray-600 hover:text-gray-900">
                Products
              </a>
              <a href="/seller/support" className="text-gray-600 hover:text-gray-900">
                Suport
              </a>
              <a href="/seller" className="text-gray-600 hover:text-gray-900">
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
