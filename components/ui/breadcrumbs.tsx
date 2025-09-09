import Link from "next/link";

export type Crumb = { label: string; href?: string };

export function Breadcrumbs({ items }: { items: Crumb[] }) {
  const lastIndex = items.length - 1;

  return (
    <nav aria-label="breadcrumb" className="mb-4">
      <ol className="flex flex-wrap items-center gap-1 text-sm text-slate-600 dark:text-slate-300">
        {items.map((item, i) => {
          const isLast = i === lastIndex;
          const el = item.href && !isLast ? (
            <Link
              href={item.href}
              className="hover:text-brand underline-offset-4 hover:underline transition-colors"
            >
              {item.label}
            </Link>
          ) : (
            <span 
              aria-current={isLast ? "page" : undefined} 
              className={isLast ? "font-medium text-ink dark:text-slate-100" : ""}
            >
              {item.label}
            </span>
          );

          return (
            <li key={`${item.label}-${i}`} className="flex items-center gap-1">
              {el}
              {!isLast && <span className="mx-1 text-slate-400 dark:text-slate-500">/</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}