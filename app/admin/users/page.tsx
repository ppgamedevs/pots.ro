import { AdminPageWrapper } from "@/components/admin/AdminPageWrapper";
import AdminUsersClient from "./client";

export default function AdminUsersPage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <AdminPageWrapper 
        title="Utilizatori & Roluri"
        description="Gestionează utilizatorii platformei și rolurile acestora"
      >
        <AdminUsersClient />
      </AdminPageWrapper>
    </main>
  );
}
