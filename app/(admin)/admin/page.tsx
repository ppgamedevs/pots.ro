import Link from "next/link";
import { Package, Users, ShoppingBag, DollarSign, Settings, FileText, UserCog, Tags, CreditCard, Webhook, Percent, Shield, Megaphone, LayoutDashboard, Headphones, Wrench, Code2, HardDrive } from "lucide-react";
import { db } from "@/db";
import { orders, products, sellerApplications } from "@/db/schema/core";
import { and, eq, gte, ne, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function getQuickStats() {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const [pendingSellerAppsRows, newOrdersTodayRows, activeProductsRows] = await Promise.all([
    db
      .select({ count: sql<number>`count(*)` })
      .from(sellerApplications)
      .where(
        and(
          ne(sellerApplications.status, "approved"),
          ne(sellerApplications.status, "rejected")
        )
      ),
    db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(gte(orders.createdAt, startOfToday)),
    db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.status, "active")),
  ]);

  const pendingSellerAppsRow = pendingSellerAppsRows[0];
  const newOrdersTodayRow = newOrdersTodayRows[0];
  const activeProductsRow = activeProductsRows[0];

  return {
    pendingSellerApps: Number(pendingSellerAppsRow?.count ?? 0),
    newOrdersToday: Number(newOrdersTodayRow?.count ?? 0),
    activeProducts: Number(activeProductsRow?.count ?? 0),
  };
}

export default async function AdminDashboardPage() {
  const stats = await getQuickStats();

  const menuItems = [
    {
      title: "Overview",
      description: "KPI-uri și alerte pentru platformă",
      href: "/admin/overview",
      icon: LayoutDashboard,
      color: "bg-indigo-600",
    },
    {
      title: "Catalog",
      description: "Categorii, structura catalogului și organizare",
      href: "/admin/catalog/categories",
      icon: Tags,
      color: "bg-slate-700",
    },
    {
      title: "Selleri",
      description: "Informații, produse, vânzări și suport pentru vânzători",
      href: "/admin/sellers",
      icon: Users,
      color: "bg-teal-500",
    },
    {
      title: "Aplicații Vânzători",
      description: "Gestionează cererile de înregistrare ale vânzătorilor",
      href: "/admin/seller-applications",
      icon: Users,
      color: "bg-blue-500",
    },
    {
      title: "Produse",
      description: "Vizualizează și gestionează toate produsele",
      href: "/admin/products",
      icon: Package,
      color: "bg-green-500",
    },
    {
      title: "Comenzi",
      description: "Monitorizează toate comenzile platformei",
      href: "/admin/orders",
      icon: ShoppingBag,
      color: "bg-purple-500",
    },
    {
      title: "Finanțe",
      description: "Gestionează plăți, comisioane și payout-uri",
      href: "/admin/finante",
      icon: DollarSign,
      color: "bg-yellow-500",
    },
    {
      title: "Comisioane",
      description: "Comision rates (versioned/effective) + 2-person approval",
      href: "/admin/commissions",
      icon: Percent,
      color: "bg-amber-600",
    },
    {
      title: "Payments",
      description: "Plăți Netopia (listă + reconcile/exception)",
      href: "/admin/payments",
      icon: CreditCard,
      color: "bg-emerald-600",
    },
    {
      title: "Webhooks",
      description: "Webhook events (payload redacted + replay/escalate)",
      href: "/admin/webhooks",
      icon: Webhook,
      color: "bg-sky-600",
    },
    {
      title: "Support Console",
      description: "Unified inbox, moderation, flags, chatbot queue",
      href: "/admin/support",
      icon: Headphones,
      color: "bg-cyan-600",
    },
    {
      title: "Communication",
      description: "Broadcasts (approval/scheduling), suppressions, deliverability",
      href: "/admin/communication",
      icon: Megaphone,
      color: "bg-rose-600",
    },
    {
      title: "Security",
      description: "Audit logs, abuse/rate limiting, PII reveal",
      href: "/admin/security",
      icon: Shield,
      color: "bg-slate-900",
    },
    {
      title: "Compliance",
      description: "GDPR consents, DSAR queue, retention purges",
      href: "/admin/compliance",
      icon: Shield,
      color: "bg-slate-800",
    },
    {
      title: "Analytics",
      description: "Statistici și rapoarte despre platformă",
      href: "/admin/analytics",
      icon: FileText,
      color: "bg-indigo-500",
    },
    {
      title: "Utilizatori & Roluri",
      description: "Gestionează utilizatorii platformei și rolurile acestora",
      href: "/admin/users",
      icon: UserCog,
      color: "bg-red-500",
    },
    {
      title: "Setări",
      description: "Configurează setările platformei",
      href: "/admin/settings",
      icon: Settings,
      color: "bg-gray-500",
    },
    {
      title: "Developer",
      description: "API Keys & Outbound Webhooks",
      href: "/admin/developer",
      icon: Code2,
      color: "bg-zinc-900",
    },
    {
      title: "Ops",
      description: "Logs, backups, migrations (admin-only)",
      href: "/admin/ops",
      icon: HardDrive,
      color: "bg-neutral-800",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Bun venit în panoul de administrare FloristMarket
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all"
            >
              <div className="flex items-start gap-4">
                <div className={`${item.color} p-3 rounded-lg text-white`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="mt-12 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <h2 className="text-xl font-semibold text-blue-900 mb-2">
          Acces rapid
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">Aplicații în așteptare</p>
            <p className="text-2xl font-bold text-gray-900">{stats.pendingSellerApps}</p>
            <Link
              href="/admin/seller-applications"
              className="text-sm text-blue-700 hover:underline"
            >
              Vezi aplicațiile
            </Link>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">Comenzi noi astăzi</p>
            <p className="text-2xl font-bold text-gray-900">{stats.newOrdersToday}</p>
            <Link href="/admin/orders" className="text-sm text-blue-700 hover:underline">
              Vezi comenzile
            </Link>
          </div>
          <div className="bg-white p-4 rounded-lg">
            <p className="text-sm text-gray-600">Produse active</p>
            <p className="text-2xl font-bold text-gray-900">{stats.activeProducts}</p>
            <Link href="/admin/products" className="text-sm text-blue-700 hover:underline">
              Vezi produsele
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
