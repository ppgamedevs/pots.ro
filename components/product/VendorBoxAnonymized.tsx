import Link from "next/link";

export default function VendorBoxAnonymized() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-white/10 p-4 flex items-center justify-between bg-slate-50/60 dark:bg-white/5">
      <div className="space-y-1">
        <div className="text-sm text-slate-500 dark:text-slate-400">Vândut de</div>
        <div className="font-medium text-slate-900 dark:text-slate-100">FloristMarket.ro Marketplace</div>
        <div className="text-xs text-slate-500 dark:text-slate-400">
          Fulfillment de către FloristMarket.ro • Returnare ușoară • Suport 24/7
        </div>
      </div>
      <Link 
        href="/about/marketplace" 
        className="text-sm text-brand hover:text-brand/80 underline transition-colors"
      >
        Cum funcționează
      </Link>
    </div>
  );
}
