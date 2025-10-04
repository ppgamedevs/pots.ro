import { redirect } from 'next/navigation';
import { headers } from 'next/headers';

export default async function AdminDashboardPage() {
  const headersList = await headers();
  const userRole = headersList.get('x-user-role');
  
  if (userRole !== 'admin') {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-bg">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-ink mb-2">
            Admin Panel
          </h1>
          <p className="text-subink">
            Gestionează platforma și monitorizează performanța
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl border border-line p-6">
            <h3 className="text-lg font-semibold text-ink mb-2">Utilizatori</h3>
            <p className="text-3xl font-bold text-primary">1,234</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-line p-6">
            <h3 className="text-lg font-semibold text-ink mb-2">Vânzători</h3>
            <p className="text-3xl font-bold text-primary">89</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-line p-6">
            <h3 className="text-lg font-semibold text-ink mb-2">Produse</h3>
            <p className="text-3xl font-bold text-primary">2,456</p>
          </div>
          
          <div className="bg-white rounded-2xl border border-line p-6">
            <h3 className="text-lg font-semibold text-ink mb-2">Comenzi</h3>
            <p className="text-3xl font-bold text-primary">5,678</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-line p-6">
            <h3 className="text-lg font-semibold text-ink mb-4">Statistici Recente</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center py-2 border-b border-line">
                <span className="text-ink">Venit Azi</span>
                <span className="text-primary font-semibold">12,450 RON</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-line">
                <span className="text-ink">Comenzi Azi</span>
                <span className="text-primary font-semibold">45</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-ink">Utilizatori Noi</span>
                <span className="text-primary font-semibold">23</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-line p-6">
            <h3 className="text-lg font-semibold text-ink mb-4">Acțiuni Rapide</h3>
            <div className="space-y-3">
              <a 
                href="/admin/analytics" 
                className="block w-full bg-primary text-white text-center py-2 px-4 rounded-lg hover:bg-primary/90 transition-micro"
              >
                Vezi Statistici
              </a>
              <a 
                href="/admin/products" 
                className="block w-full border border-line text-ink text-center py-2 px-4 rounded-lg hover:bg-bg-soft transition-micro"
              >
                Gestionează Produsele
              </a>
              <a 
                href="/admin/orders" 
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
