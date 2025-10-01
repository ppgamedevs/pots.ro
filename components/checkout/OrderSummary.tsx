// OrderSummary component for Week 4 MVP frontend
import { OrderSummaryProps } from '@/types/checkout';
import { formatCents } from '@/lib/money';

export function OrderSummary({
  items,
  subtotal_cents,
  shipping_fee_cents,
  total_cents,
  currency,
}: OrderSummaryProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
        Rezumat comandă
      </h3>
      
      {/* Items list */}
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex items-center gap-3">
            {item.image_url && (
              <img
                src={item.image_url}
                alt={item.title}
                className="w-14 h-14 object-cover rounded-md"
                width={56}
                height={56}
              />
            )}
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                {item.title}
              </h4>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Cantitate: {item.qty}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {formatCents(item.price_cents * item.qty, currency)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="border-t border-slate-200 dark:border-slate-700 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
          <span className="text-slate-900 dark:text-slate-100">
            {formatCents(subtotal_cents, currency)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 dark:text-slate-400">Transport</span>
          <span className="text-slate-900 dark:text-slate-100">
            {formatCents(shipping_fee_cents, currency)}
          </span>
        </div>
        <div className="flex justify-between text-base font-semibold border-t border-slate-200 dark:border-slate-700 pt-2">
          <span className="text-slate-900 dark:text-slate-100">Total</span>
          <span className="text-slate-900 dark:text-slate-100">
            {formatCents(total_cents, currency)}
          </span>
        </div>
      </div>
    </div>
  );
}
