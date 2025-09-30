import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { H1, P } from "@/components/ui/typography";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import SellerProductsClient from "./client";

export default async function SellerProductsPage({ 
  searchParams 
}: { 
  searchParams: Promise<Record<string, string>> 
}) {
  const params = await searchParams;
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const status = params?.status ?? "active";

  // Mock data for seller products
  const mockData = {
    items: [
      {
        id: 1,
        title: "Ghiveci ceramic alb",
        price: 49.9,
        currency: "RON",
        stock: 15,
        status: "active",
        views: 234,
        sales: 12,
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-20T14:45:00Z",
      },
      {
        id: 2,
        title: "Vază ceramic înaltă",
        price: 65.0,
        currency: "RON",
        stock: 8,
        status: "active",
        views: 189,
        sales: 7,
        created_at: "2024-01-10T09:15:00Z",
        updated_at: "2024-01-18T11:20:00Z",
      },
      {
        id: 3,
        title: "Cutie decorativă",
        price: 25.0,
        currency: "RON",
        stock: 0,
        status: "inactive",
        views: 156,
        sales: 23,
        created_at: "2024-01-05T16:45:00Z",
        updated_at: "2024-01-22T08:30:00Z",
      },
    ],
    meta: {
      totalPages: 1,
      page: 1,
      totalItems: 3,
    }
  };

  const breadcrumbItems = [
    { name: "Acasă", href: "/" },
    { name: "Vânzător", href: "/s/atelier-ceramic" },
    { name: "Produsele mele", href: "/seller/products" },
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
            <H1>Produsele mele</H1>
            <P className="text-slate-600 dark:text-slate-300">
              Gestionează produsele tale. {mockData.meta.totalItems} produse în total.
            </P>
          </div>

          {/* DataTable */}
          <SellerProductsClient initial={mockData} />
        </div>
      </main>
      <Footer />
    </>
  );
}
