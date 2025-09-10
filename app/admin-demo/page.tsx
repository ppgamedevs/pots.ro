import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { H1, P } from "@/components/ui/typography";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import AdminDemoClient from "./client";

export default function AdminDemoPage() {
  const breadcrumbItems = [
    { label: "Acasă", href: "/" },
    { label: "Demo", href: "/demo" },
    { label: "Admin Interface" },
  ];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="space-y-6">
          {/* Breadcrumbs */}
          <Breadcrumbs items={breadcrumbItems} />

          {/* Header */}
          <div className="space-y-2">
            <H1>Admin Interface Demo</H1>
            <P className="text-slate-600 dark:text-slate-300">
              Demonstrație pentru adaptorul Supabase și componenta DataTable.
            </P>
          </div>

          {/* Demo Content */}
          <AdminDemoClient />
        </div>
      </main>
      <Footer />
    </>
  );
}
