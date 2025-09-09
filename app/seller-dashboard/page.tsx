import { DashboardTabs } from "@/components/ui/tabs-dashboard";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { H1 } from "@/components/ui/typography";

// Mock data for demonstration
const mockOrders = [
  { id: 1, customer: "Ion Popescu", amount: 149.90, status: "active", date: "2024-01-15" },
  { id: 2, customer: "Maria Ionescu", amount: 89.50, status: "shipped", date: "2024-01-14" },
  { id: 3, customer: "Alexandru Marin", amount: 234.00, status: "active", date: "2024-01-13" },
];

const mockProducts = [
  { id: 1, title: "Ghiveci ceramic alb", price: 49.90, stock: 12, status: "active" },
  { id: 2, title: "Cutie înaltă natur", price: 79.00, stock: 8, status: "active" },
  { id: 3, title: "Panglică satin", price: 14.50, stock: 0, status: "inactive" },
];

const mockPayouts = [
  { id: 1, amount: 1250.40, status: "completed", date: "2024-01-10" },
  { id: 2, amount: 890.20, status: "pending", date: "2024-01-15" },
];

const mockMessages = [
  { id: 1, from: "Client Anonim", subject: "Întrebare despre livrare", unread: true },
  { id: 2, from: "Support", subject: "Actualizare cont", unread: false },
];

function OrdersTable() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Comenzi Recente</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10">
              <th className="text-left py-2 text-slate-600 dark:text-slate-300">ID</th>
              <th className="text-left py-2 text-slate-600 dark:text-slate-300">Client</th>
              <th className="text-left py-2 text-slate-600 dark:text-slate-300">Sumă</th>
              <th className="text-left py-2 text-slate-600 dark:text-slate-300">Status</th>
              <th className="text-left py-2 text-slate-600 dark:text-slate-300">Dată</th>
            </tr>
          </thead>
          <tbody>
            {mockOrders.map((order) => (
              <tr key={order.id} className="border-b border-slate-100 dark:border-white/5">
                <td className="py-3 text-slate-900 dark:text-slate-100">#{order.id}</td>
                <td className="py-3 text-slate-900 dark:text-slate-100">{order.customer}</td>
                <td className="py-3 text-slate-900 dark:text-slate-100 font-medium">{order.amount} RON</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    order.status === 'active' 
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  }`}>
                    {order.status === 'active' ? 'Activă' : 'Expediată'}
                  </span>
                </td>
                <td className="py-3 text-slate-600 dark:text-slate-300">{order.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ProductsTable() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Produsele Mele</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10">
              <th className="text-left py-2 text-slate-600 dark:text-slate-300">Produs</th>
              <th className="text-left py-2 text-slate-600 dark:text-slate-300">Preț</th>
              <th className="text-left py-2 text-slate-600 dark:text-slate-300">Stoc</th>
              <th className="text-left py-2 text-slate-600 dark:text-slate-300">Status</th>
            </tr>
          </thead>
          <tbody>
            {mockProducts.map((product) => (
              <tr key={product.id} className="border-b border-slate-100 dark:border-white/5">
                <td className="py-3 text-slate-900 dark:text-slate-100">{product.title}</td>
                <td className="py-3 text-slate-900 dark:text-slate-100 font-medium">{product.price} RON</td>
                <td className="py-3 text-slate-900 dark:text-slate-100">{product.stock}</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    product.status === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
                  }`}>
                    {product.status === 'active' ? 'Activ' : 'Inactiv'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PayoutsTable() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Încasări</h3>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 dark:border-white/10">
              <th className="text-left py-2 text-slate-600 dark:text-slate-300">ID</th>
              <th className="text-left py-2 text-slate-600 dark:text-slate-300">Sumă</th>
              <th className="text-left py-2 text-slate-600 dark:text-slate-300">Status</th>
              <th className="text-left py-2 text-slate-600 dark:text-slate-300">Dată</th>
            </tr>
          </thead>
          <tbody>
            {mockPayouts.map((payout) => (
              <tr key={payout.id} className="border-b border-slate-100 dark:border-white/5">
                <td className="py-3 text-slate-900 dark:text-slate-100">#{payout.id}</td>
                <td className="py-3 text-slate-900 dark:text-slate-100 font-medium">{payout.amount} RON</td>
                <td className="py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    payout.status === 'completed' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                  }`}>
                    {payout.status === 'completed' ? 'Completat' : 'În așteptare'}
                  </span>
                </td>
                <td className="py-3 text-slate-600 dark:text-slate-300">{payout.date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MessagesView() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Mesaje</h3>
      </div>
      
      <div className="space-y-3">
        {mockMessages.map((message) => (
          <div key={message.id} className={`p-4 rounded-lg border ${
            message.unread 
              ? 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20' 
              : 'border-slate-200 bg-white dark:border-white/10 dark:bg-slate-900/60'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`font-medium ${message.unread ? 'text-blue-900 dark:text-blue-100' : 'text-slate-900 dark:text-slate-100'}`}>
                  {message.from}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-300">{message.subject}</p>
              </div>
              {message.unread && (
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SellerDashboard() {
  const tabs = [
    { 
      value: "orders", 
      label: "Comenzi", 
      count: mockOrders.length, 
      content: <OrdersTable /> 
    },
    { 
      value: "products", 
      label: "Produse", 
      count: mockProducts.length, 
      content: <ProductsTable /> 
    },
    { 
      value: "payouts", 
      label: "Încasări", 
      count: mockPayouts.length, 
      content: <PayoutsTable /> 
    },
    { 
      value: "messages", 
      label: "Mesaje", 
      count: mockMessages.filter(m => m.unread).length, 
      content: <MessagesView /> 
    },
  ];

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-6xl px-4 py-6">
        <div className="space-y-6">
          <H1>Dashboard Vânzător</H1>
          
          <DashboardTabs
            defaultValue="orders"
            items={tabs}
          />
        </div>
      </main>
      <Footer />
    </>
  );
}
