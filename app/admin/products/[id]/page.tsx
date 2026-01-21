import { AdminPageWrapper } from "@/components/admin/AdminPageWrapper";
import AdminProductDetailClient from "./client";

export default function AdminProductDetailPage({ params }: { params: { id: string } }) {
  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <AdminPageWrapper
        title="Produs"
        description="Editare câmpuri + imagini + istoric (audit)"
        showBackButton
        backButtonHref="/admin/products"
      >
        <AdminProductDetailClient id={params.id} />
      </AdminPageWrapper>
    </main>
  );
}
