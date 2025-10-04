import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function SellerDashboardPage() {
  const headersList = await headers();
  const userRole = headersList.get('x-user-role');
  
  if (userRole !== 'seller' && userRole !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink mb-2">
            Dashboard Vânzător
          </h1>
          <p className="text-subink">
            Gestionează produsele și comenzile tale
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-line p-6">
            <h3 className="text-lg font-semibold text-ink mb-2">Produse Active</h3>
            <p className="text-3xl font-bold text-primary">12</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-line p-6">
            <h3 className="text-lg font-semibold text-ink mb-2">Comenzi Azi</h3>
            <p className="text-3xl font-bold text-primary">3</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-line p-6">
            <h3 className="text-lg font-semibold text-ink mb-2">Venit Lunar</h3>
            <p className="text-3xl font-bold text-primary">2,450 RON</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-line p-6">
            <h3 className="text-lg font-semibold text-ink mb-2">Rating</h3>
            <p className="text-3xl font-bold text-primary">4.8</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-line p-6">
            <h3 className="text-lg font-semibold text-ink mb-4">Comenzi Recente</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-line">
                <span className="text-ink">#12345</span>
                <span className="text-primary font-semibold">89 RON</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-line">
                <span className="text-ink">#12344</span>
                <span className="text-primary font-semibold">156 RON</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-ink">#12343</span>
                <span className="text-primary font-semibold">234 RON</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-line p-6">
            <h3 className="text-lg font-semibold text-ink mb-4">Acțiuni Rapide</h3>
            <div className="space-y-3">
              <a 
                href="/dashboard/products/new" 
                className="block w-full bg-primary text-white text-center py-2 px-4 rounded-lg hover:bg-primary/90 transition-micro"
              >
                Adaugă Produs Nou
              </a>
              <a 
                href="/dashboard/products" 
                className="block w-full border border-line text-ink text-center py-2 px-4 rounded-lg hover:bg-bg-soft transition-micro"
              >
                Gestionează Produsele
              </a>
              <a 
                href="/dashboard/orders" 
                className="block w-full border border-line text-ink text-center py-2 px-4 rounded-lg hover:bg-bg-soft transition-micro"
              >
                Vezi Comenzile
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
