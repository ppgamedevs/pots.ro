"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { DashboardTabs } from "@/components/ui/dashboard-tabs";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { stagger, fadeInUp } from "@/components/motion";

// Mock data
const mockOrders = {
  active: [
    { id: 1, customer: "Ion Popescu", amount: 149.90, date: "2024-01-15" },
    { id: 2, customer: "Maria Ionescu", amount: 89.50, date: "2024-01-14" },
    { id: 3, customer: "Alexandru Marin", amount: 234.00, date: "2024-01-13" },
  ],
  shipped: [
    { id: 4, customer: "Elena Dumitrescu", amount: 67.80, date: "2024-01-12" },
    { id: 5, customer: "Cristian Radu", amount: 156.40, date: "2024-01-11" },
  ],
  refunds: [
    { id: 6, customer: "Ana Constantinescu", amount: 45.60, date: "2024-01-10", reason: "Produs defect" },
  ],
};

export default function DashboardDemoPage() {
  const [selectedTab, setSelectedTab] = useState("active");

  const OrdersTable = ({ status }: { status: keyof typeof mockOrders }) => {
    const orders = mockOrders[status];
    
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {status === "active" ? "Comenzi Active" : 
             status === "shipped" ? "Comenzi Expediate" : 
             "Refunduri"}
          </h3>
          <Badge variant={status === "active" ? "brand" : status === "shipped" ? "success" : "warning"}>
            {orders.length} comenzi
          </Badge>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-white/10">
                <th className="text-left py-2 text-slate-600 dark:text-slate-300">ID</th>
                <th className="text-left py-2 text-slate-600 dark:text-slate-300">Client</th>
                <th className="text-left py-2 text-slate-600 dark:text-slate-300">Sumă</th>
                <th className="text-left py-2 text-slate-600 dark:text-slate-300">Dată</th>
                {status === "refunds" && (
                  <th className="text-left py-2 text-slate-600 dark:text-slate-300">Motiv</th>
                )}
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b border-slate-100 dark:border-white/5">
                  <td className="py-3 text-slate-900 dark:text-slate-100">#{order.id}</td>
                  <td className="py-3 text-slate-900 dark:text-slate-100">{order.customer}</td>
                  <td className="py-3 text-slate-900 dark:text-slate-100 font-medium">{order.amount} RON</td>
                  <td className="py-3 text-slate-600 dark:text-slate-300">{order.date}</td>
                  {status === "refunds" && (
                    <td className="py-3 text-slate-600 dark:text-slate-300">{'reason' in order ? order.reason : 'N/A'}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const tabs = [
    { 
      value: "active", 
      label: "Active", 
      count: mockOrders.active.length, 
      countVariant: "brand" as const, 
      content: <OrdersTable status="active" /> 
    },
    { 
      value: "shipped", 
      label: "Expediate", 
      count: mockOrders.shipped.length, 
      countVariant: "success" as const, 
      content: <OrdersTable status="shipped" /> 
    },
    { 
      value: "delivered", 
      label: "Livrate", 
      count: 20, 
      countVariant: "neutral" as const, 
      content: <OrdersTable status="active" /> 
    },
    { 
      value: "refunds", 
      label: "Refunduri", 
      count: mockOrders.refunds.length, 
      countVariant: "warning" as const, 
      content: <OrdersTable status="refunds" /> 
    },
  ];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-10">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="space-y-8"
        >
          <motion.div variants={fadeInUp} className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">Dashboard Demo</h1>
            <p className="text-slate-600 dark:text-slate-300">
              Tabs cu contoare și badge-uri pentru dashboard-uri
            </p>
          </motion.div>

          {/* Dashboard Tabs Demo */}
          <motion.section variants={fadeInUp} className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Comenzi Vânzător</h2>
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60">
              <DashboardTabs
                defaultValue="active"
                tabs={tabs}
              />
            </div>
          </motion.section>

          {/* Badge Variants Demo */}
          <motion.section variants={fadeInUp} className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Badge Variants</h2>
            <div className="p-6 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60">
              <div className="flex flex-wrap gap-3">
                <Badge variant="neutral">Neutral 5</Badge>
                <Badge variant="success">Success 12</Badge>
                <Badge variant="warning">Warning 3</Badge>
                <Badge variant="danger">Danger 1</Badge>
                <Badge variant="brand">Brand 8</Badge>
              </div>
            </div>
          </motion.section>

          {/* Features */}
          <motion.section variants={fadeInUp} className="space-y-4">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Caracteristici</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Dashboard Tabs</h3>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• Contoare cu badge-uri</li>
                  <li>• Variante de culori</li>
                  <li>• Keyboard navigation</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Badge System</h3>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• 5 variante de culori</li>
                  <li>• Dark mode support</li>
                  <li>• Consistent sizing</li>
                </ul>
              </div>
              <div className="p-4 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/60">
                <h3 className="font-medium text-slate-900 dark:text-slate-100 mb-2">Server Ready</h3>
                <ul className="text-sm text-slate-600 dark:text-slate-300 space-y-1">
                  <li>• Pagination helpers</li>
                  <li>• Supabase integration</li>
                  <li>• Type safety</li>
                </ul>
              </div>
            </div>
          </motion.section>
        </motion.div>
      </main>
      <Footer />
    </>
  );
}
