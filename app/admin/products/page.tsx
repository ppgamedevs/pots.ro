import { Pagination } from "@/components/ui/pagination";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { H1, P } from "@/components/ui/typography";
import AdminProductsClient from "./client";

export default async function AdminProductsPage({ 
  searchParams 
}: { 
  searchParams: Promise<Record<string, string>> 
}) {
  const params = await searchParams;
  const page = params?.page ?? 1;
  const pageSize = params?.pageSize ?? 20;
  const q = params?.q ?? "";
  const status = params?.status ?? "active";

  // Build API URL with search params
  const apiUrl = new URL("/api/admin/products", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  apiUrl.searchParams.set("page", page.toString());
  apiUrl.searchParams.set("pageSize", pageSize.toString());
  if (q) apiUrl.searchParams.set("q", q);
  if (status) apiUrl.searchParams.set("status", status);

  let data = { items: [], meta: { totalPages: 1, page: 1, totalItems: 0 } };
  
  try {
    const res = await fetch(apiUrl.toString(), { 
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
      }
    });
    
    if (res.ok) {
      data = await res.json();
    }
  } catch (error) {
    console.error("Error fetching products:", error);
  }

  const breadcrumbItems = [
    { name: "Acasă", href: "/" },
    { name: "Admin", href: "/admin" },
    { name: "Produse", href: "/admin/products" },
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
            <H1>Gestionare Produse</H1>
            <P className="text-slate-600 dark:text-slate-300">
              Administrează produsele din platformă. {data.meta.totalItems} produse găsite.
            </P>
          </div>

          {/* DataTable */}
          <AdminProductsClient initial={data} />

          {/* Pagination */}
          {data.meta.totalPages > 1 && (
            <Pagination
              totalPages={data.meta.totalPages}
              currentPage={data.meta.page}
              ariaLabel="Paginare produse admin"
            />
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
