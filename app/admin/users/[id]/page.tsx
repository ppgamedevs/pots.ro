import { AdminPageWrapper } from "@/components/admin/AdminPageWrapper";
import { db } from "@/db";
import { users } from "@/db/schema/core";
import { eq } from "drizzle-orm";
import { getCurrentUser } from "@/lib/auth/session";
import AdminUserDetailClient from "./client";
import { notFound } from "next/navigation";

async function getUser(id: string) {
  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      created_at: users.createdAt,
      updated_at: users.updatedAt,
    })
    .from(users)
    .where(eq(users.id, id))
    .limit(1);

  return user || null;
}


export default async function AdminUserDetailPage({ params }: { params: { id: string } }) {
  const currentUser = await getCurrentUser();
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'support')) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <AdminPageWrapper title="Acces restricționat">
          <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-white/10 rounded-xl shadow-sm p-8">
            <p className="text-slate-700 dark:text-slate-300">Nu ai permisiuni pentru a accesa această pagină.</p>
          </div>
        </AdminPageWrapper>
      </main>
    );
  }

  const user = await getUser(params.id);
  if (!user) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-10">
      <AdminPageWrapper 
        title={`Utilizator: ${user.email}`}
        description={`Creat pe ${new Date(user.created_at).toLocaleDateString('ro-RO')}`}
        backButtonHref="/admin/users"
        customBreadcrumbLabel="Detalii Utilizator"
      >
        <AdminUserDetailClient user={user} />
      </AdminPageWrapper>
    </main>
  );
}
