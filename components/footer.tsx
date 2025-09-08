export function Footer() {
  return (
    <footer className="border-t border-slate-200 dark:border-white/10 mt-10">
      <div className="mx-auto max-w-6xl px-4 py-10 grid gap-6 md:grid-cols-3 text-sm">
        <div>
          <div className="font-semibold mb-2">Pots.ro</div>
          <p className="text-slate-600 dark:text-slate-300">Marketplace românesc pentru produse de floristică.</p>
        </div>
        <div>
          <div className="font-semibold mb-2">Companie</div>
          <ul className="space-y-1 text-slate-600 dark:text-slate-300">
            <li><a href="/about" className="hover:text-brand">Despre</a></li>
            <li><a href="/contact" className="hover:text-brand">Contact</a></li>
            <li><a href="/termeni" className="hover:text-brand">Termeni & Condiții</a></li>
            <li><a href="/gdpr" className="hover:text-brand">GDPR</a></li>
          </ul>
        </div>
        <div>
          <div className="font-semibold mb-2">Ajutor</div>
          <ul className="space-y-1 text-slate-600 dark:text-slate-300">
            <li><a href="/ajutor" className="hover:text-brand">FAQ</a></li>
            <li><a href="/livrare-retur" className="hover:text-brand">Livrare & Retur</a></li>
          </ul>
        </div>
      </div>
      <div className="text-center text-xs text-slate-500 dark:text-slate-400 pb-6">© {new Date().getFullYear()} Pots.ro</div>
    </footer>
  );
}
