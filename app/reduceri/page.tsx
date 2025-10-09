import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Reducerile lunii - FloristMarket',
  description: 'Descoperă ofertele speciale la cutii, ghivece și accesorii florale. Reduceri până la -30% pe produsele selectate.',
};

export default function ReduceriPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Reducerile lunii
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Descoperă ofertele speciale la cutii, ghivece și accesorii florale. 
            Reduceri până la -30% pe produsele selectate.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-semibold text-gray-900 mb-4">
            Pagina reducerilor este în dezvoltare
          </h2>
          <p className="text-gray-600 mb-6">
            În curând vei putea descoperi toate ofertele speciale și reducerile disponibile.
          </p>
          <a 
            href="/products" 
            className="inline-flex px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            Vezi toate produsele →
          </a>
        </div>
      </div>
    </div>
  );
}
