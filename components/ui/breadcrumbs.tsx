import * as React from "react";
import { ChevronRight, Home } from "lucide-react";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps extends React.HTMLAttributes<HTMLElement> {
  items: BreadcrumbItem[];
  separator?: React.ReactNode;
  showHome?: boolean;
}

const Breadcrumbs = React.forwardRef<HTMLElement, BreadcrumbsProps>(
  ({ className, items, separator, showHome = true, ...props }, ref) => {
    const allItems = showHome 
      ? [{ label: "Acasă", href: "/" }, ...items]
      : items;

    return (
      <nav
        ref={ref}
        aria-label="Breadcrumb"
        className={cn("flex items-center space-x-1 text-sm text-slate-500 dark:text-slate-400", className)}
        {...props}
      >
        <ol className="flex items-center space-x-1">
          {allItems.map((item, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && (
                <span className="mx-2 text-slate-300 dark:text-slate-600">
                  {separator || <ChevronRight className="h-4 w-4" />}
                </span>
              )}
              {item.href ? (
                <a
                  href={item.href}
                  className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
                >
                  {index === 0 && showHome ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    item.label
                  )}
                </a>
              ) : (
                <span className="text-slate-900 dark:text-slate-100 font-medium">
                  {item.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
    );
  }
);
Breadcrumbs.displayName = "Breadcrumbs";

export { Breadcrumbs };
