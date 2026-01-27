import { ReactNode } from "react";

export default function SupportLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <main role="main" className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
