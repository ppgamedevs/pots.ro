export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-gray-900 mb-8">
          Welcome to Pots.ro
        </h1>
        <p className="text-xl text-center text-gray-600 mb-8">
          A modern e-commerce platform built with Next.js 14, Vercel Postgres, Drizzle ORM, Lucia Auth, and Vercel Blob.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Backend APIs</h2>
            <p className="text-gray-600">
              Complete REST API with authentication, product management, and search functionality.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Database</h2>
            <p className="text-gray-600">
              Vercel Postgres with Drizzle ORM, full-text search, and optimized indexes.
            </p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Authentication</h2>
            <p className="text-gray-600">
              Lucia Auth with role-based access control and session management.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}