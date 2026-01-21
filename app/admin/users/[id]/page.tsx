import { AdminPageWrapper } from "@/components/admin/AdminPageWrapper";
import { db } from "@/db";
import { users, sessions, sellers, sellerApplications } from "@/db/schema/core";
import { eq, and, isNull, max, desc } from "drizzle-orm";
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

  if (!user) return null;

  // Get last login date (same logic as API)
  let lastLogin: Date | null = null;
  try {
    const [result] = await db
      .select({
        last_login: max(sessions.createdAt),
      })
      .from(sessions)
      .where(and(
        eq(sessions.userId, id),
        isNull(sessions.revokedAt)
      ));
    
    if (result?.last_login) {
      lastLogin = new Date(result.last_login);
    }
  } catch (err) {
    console.error(`Error fetching last login for user ${id}:`, err);
  }

  // Get seller information if user is a seller
  let sellerInfo = null;
  if (user.role === 'seller') {
    try {
      const [seller] = await db
        .select({
          brandName: sellers.brandName,
          legalName: sellers.legalName,
          cui: sellers.cui,
          phone: sellers.phone,
          email: sellers.email,
          iban: sellers.iban,
          about: sellers.about,
        })
        .from(sellers)
        .where(eq(sellers.userId, id))
        .limit(1);
      
      if (seller) {
        // Try to get website from seller application (most recent approved one)
        let website: string | null = null;
        try {
          const [application] = await db
            .select({
              website: sellerApplications.website,
            })
            .from(sellerApplications)
            .where(eq(sellerApplications.email, user.email))
            .orderBy(desc(sellerApplications.createdAt))
            .limit(1);
          
          if (application?.website) {
            website = application.website;
          }
        } catch (appErr) {
          // Ignore errors when fetching application
        }
        
        sellerInfo = {
          ...seller,
          website,
        };
      }
    } catch (err) {
      console.error(`Error fetching seller info for user ${id}:`, err);
    }
  }

  return {
    ...user,
    last_login: lastLogin?.toISOString() || null,
    sellerInfo,
  };
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
