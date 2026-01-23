"use client";
import { useState } from "react";
import { Trash2, Download, CheckCircle, AlertCircle } from "lucide-react";

export default function GDPRPage() {
  const [deleteForm, setDeleteForm] = useState({
    email: "",
    confirm: false,
  });
  const [exportForm, setExportForm] = useState({
    email: "",
    confirm: false,
  });
  const [submitted, setSubmitted] = useState<"delete" | "export" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const formData = new FormData();
      formData.set('email', deleteForm.email);
      formData.set('confirm', deleteForm.confirm ? 'true' : 'false');

      const res = await fetch('/api/gdpr/delete-request', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Eroare la trimiterea cererii');
      }

      setSubmitted('delete');
      setTimeout(() => setSubmitted(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare internă');
    }
  };

  const handleExportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      const formData = new FormData();
      formData.set('email', exportForm.email);
      formData.set('confirm', exportForm.confirm ? 'true' : 'false');

      const res = await fetch('/api/gdpr/export-request', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Eroare la trimiterea cererii');
      }

      setSubmitted('export');
      setTimeout(() => setSubmitted(null), 5000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Eroare internă');
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-ink">Drepturile tale GDPR</h1>
        <p className="text-subink mt-2">
          Exercită-ți drepturile conform Regulamentului General privind Protecția Datelor (GDPR)
        </p>
      </div>

      <div className="mb-8 p-6 rounded-xl border border-line bg-bg-soft">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-primary text-white">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <h2 className="font-semibold text-ink mb-2">Informații importante</h2>
            <div className="text-sm text-subink space-y-2">
              <p>• Cererile sunt procesate în maximum 30 de zile calendaristice</p>
              <p>• Vei primi confirmarea pe email în 24h</p>
              <p>• Pentru ștergerea contului, toate datele asociate vor fi șterse definitiv</p>
              <p>• Pentru exportul datelor, vei primi un fișier JSON cu toate informațiile</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {error && (
          <div className="md:col-span-2 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <div className="text-sm text-red-800">{error}</div>
          </div>
        )}
        {/* Delete Request */}
        <div className="rounded-2xl border border-line p-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-red-50 text-red-600">
              <Trash2 className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">Solicită ștergerea contului</h2>
              <p className="text-sm text-subink">Șterge definitiv toate datele tale personale</p>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200">
            <h3 className="font-medium text-red-800 mb-2">⚠️ Atenție!</h3>
            <div className="text-sm text-red-700 space-y-1">
              <p>• Contul și toate datele asociate vor fi șterse definitiv</p>
              <p>• Nu vei mai putea accesa istoricul comenzilor</p>
              <p>• Nu vei mai primi notificări sau newsletter</p>
              <p>• Această acțiune nu poate fi anulată</p>
            </div>
          </div>

          <form onSubmit={handleDeleteSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Adresa de email asociată contului
              </label>
              <input
                type="email"
                value={deleteForm.email}
                onChange={e => setDeleteForm({...deleteForm, email: e.target.value})}
                className="field"
                placeholder="exemplu@email.com"
                required
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="delete-confirm"
                checked={deleteForm.confirm}
                onChange={e => setDeleteForm({...deleteForm, confirm: e.target.checked})}
                className="mt-1"
                required
              />
              <label htmlFor="delete-confirm" className="text-sm text-ink">
                Confirm că înțeleg că ștergerea contului este definitivă și că toate datele 
                asociate vor fi șterse permanent. Nu pot anula această acțiune.
              </label>
            </div>

            <button 
              type="submit" 
              className="w-full px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-micro font-medium"
              disabled={!deleteForm.confirm || !deleteForm.email}
            >
              Solicită ștergerea contului
            </button>
          </form>

          {submitted === "delete" && (
            <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="text-sm text-green-800">
                <p className="font-medium">Cererea a fost trimisă!</p>
                <p>Vei primi confirmarea pe email în 24h și procesarea va fi finalizată în maximum 30 de zile.</p>
              </div>
            </div>
          )}
        </div>

        {/* Export Request */}
        <div className="rounded-2xl border border-line p-6 bg-white">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-ink">Solicită exportul datelor</h2>
              <p className="text-sm text-subink">Primește o copie a tuturor datelor tale</p>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
            <h3 className="font-medium text-blue-800 mb-2">📋 Ce vei primi</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• Toate datele din contul tău</p>
              <p>• Istoricul complet al comenzilor</p>
              <p>• Preferințele și setările</p>
              <p>• Datele de comunicare și suport</p>
              <p>• Fișier JSON structurat și ușor de citit</p>
            </div>
          </div>

          <form onSubmit={handleExportSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1">
                Adresa de email pentru trimiterea fișierului
              </label>
              <input
                type="email"
                value={exportForm.email}
                onChange={e => setExportForm({...exportForm, email: e.target.value})}
                className="field"
                placeholder="exemplu@email.com"
                required
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="export-confirm"
                checked={exportForm.confirm}
                onChange={e => setExportForm({...exportForm, confirm: e.target.checked})}
                className="mt-1"
                required
              />
              <label htmlFor="export-confirm" className="text-sm text-ink">
                Confirm că vreau să primesc o copie a tuturor datelor mele personale 
                în format structurat și că înțeleg că fișierul va conține informații sensibile.
              </label>
            </div>

            <button 
              type="submit" 
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-micro font-medium"
              disabled={!exportForm.confirm || !exportForm.email}
            >
              Solicită exportul datelor
            </button>
          </form>

          {submitted === "export" && (
            <div className="mt-4 p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <div className="text-sm text-green-800">
                <p className="font-medium">Cererea a fost trimisă!</p>
                <p>Vei primi confirmarea pe email în 24h și fișierul cu datele tale în maximum 30 de zile.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 p-6 rounded-xl border border-line bg-bg-soft">
        <h3 className="font-semibold text-ink mb-4">Alte întrebări despre GDPR?</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-ink mb-2">Contact general</h4>
            <p className="text-sm text-subink mb-2">
              Pentru întrebări generale despre protecția datelor și drepturile tale.
            </p>
            <a 
              href="mailto:privacy@floristmarket.ro"
              className="text-primary hover:underline text-sm"
            >
              privacy@floristmarket.ro
            </a>
          </div>
          <div>
            <h4 className="font-medium text-ink mb-2">Suport tehnic</h4>
            <p className="text-sm text-subink mb-2">
              Pentru probleme tehnice cu contul sau dificultăți în exercitarea drepturilor.
            </p>
            <a 
              href="mailto:support@floristmarket.ro"
              className="text-primary hover:underline text-sm"
            >
              support@floristmarket.ro
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
