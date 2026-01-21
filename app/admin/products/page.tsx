import { AdminPageWrapper } from "@/components/admin/AdminPageWrapper";
import AdminProductsClient from "./client";

export default function AdminProductsPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <AdminPageWrapper 
        title="Gestionare Produse"
        description="Administrează produsele din platformă"
      >
        <AdminProductsClient />
      </AdminPageWrapper>
    </main>
  );
}
