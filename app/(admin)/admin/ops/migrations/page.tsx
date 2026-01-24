export const dynamic = 'force-dynamic';

export default function AdminOpsMigrationsPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Ops · Migrations</h1>
        <p className="text-gray-600 mt-2">Status + drift detection (implementation next)</p>
      </div>

      <div className="rounded border border-gray-200 bg-white p-4 text-sm text-gray-700">
        Coming next: list applied Drizzle migrations and run drift detection in maintenance mode.
      </div>
    </div>
  );
}
