import { AdminPageWrapper } from "@/components/admin/AdminPageWrapper";
import AdminOrdersClient from "./client";

export default function AdminOrdersPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <AdminPageWrapper 
        title="Comenzi"
        description="Gestionează și monitorizează toate comenzile platformei"
      >
        <AdminOrdersClient />
      </AdminPageWrapper>
    </main>
  );
}
