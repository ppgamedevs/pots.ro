"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Breadcrumbs } from "@/components/ui/breadcrumbs";
import { generateAdminBreadcrumbs } from "@/lib/admin/breadcrumbs";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { clsx } from "clsx";

interface AdminPageWrapperProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showBackButton?: boolean;
  backButtonHref?: string;
  customBreadcrumbLabel?: string;
  className?: string;
  headerClassName?: string;
}

/**
 * Wrapper component pentru paginile admin care adaugă automat breadcrumbs
 * și buton de back către dashboard
 * 
 * Utilizare:
 * <AdminPageWrapper title="Aplicații Vânzători" description="Gestionează aplicațiile">
 *   {children}
 * </AdminPageWrapper>
 */
export function AdminPageWrapper({
  children,
  title,
  description,
  showBackButton = true,
  backButtonHref = "/admin",
  customBreadcrumbLabel,
  className,
  headerClassName,
}: AdminPageWrapperProps) {
  const pathname = usePathname();
  const breadcrumbItems = generateAdminBreadcrumbs(pathname, customBreadcrumbLabel);

  return (
    <div className={clsx("space-y-8", className)}>
      {/* Breadcrumbs */}
      <div className="pb-2">
        <Breadcrumbs items={breadcrumbItems} />
      </div>

      {/* Header cu buton back */}
      {(title || description || showBackButton) && (
        <div className={clsx("flex items-start gap-8 pb-2", headerClassName)}>
          {showBackButton && (
            <div className="pt-1 shrink-0">
              <Link href={backButtonHref}>
                <Button variant="outline" size="sm" className="shrink-0">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Înapoi la Dashboard
                </Button>
              </Link>
            </div>
          )}
          {title && (
            <div className="flex-1 space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
                {title}
              </h1>
              {description && (
                <p className="text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-3xl">
                  {description}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}
