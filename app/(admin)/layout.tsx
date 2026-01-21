import { ReactNode } from 'react';
import { Toaster } from 'sonner';

interface AdminLayoutProps {
  children: ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <main role="main" className="container mx-auto px-4 py-8">
        {children}
      </main>
      
      <Toaster position="top-right" />
    </div>
  );
}
