import { AdminPageWrapper } from "@/components/admin/AdminPageWrapper";
import AdminSellerApplicationsClient from "./client";

export default function AdminSellerApplicationsPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <AdminPageWrapper 
        title="Aplicații Vânzători"
        description="Gestionează cererile de înregistrare ale vânzătorilor"
      >
        <AdminSellerApplicationsClient />
      </AdminPageWrapper>
    </main>
  );
}


