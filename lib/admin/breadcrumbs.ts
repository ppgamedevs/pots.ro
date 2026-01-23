/**
 * Utility pentru generarea breadcrumbs pentru paginile admin
 * Sistem scalabil care permite adăugarea ușoară de noi rute
 */

export type BreadcrumbItem = {
  name: string;
  href: string;
};

/**
 * Configurație centralizată pentru rutele admin și label-urile lor
 * Poate fi extinsă ușor pentru noi secțiuni
 */
export const ADMIN_ROUTE_CONFIG: Record<string, { label: string; parent?: string }> = {
  '/admin': {
    label: 'Dashboard',
  },
  '/admin/sellers': {
    label: 'Selleri',
    parent: '/admin',
  },
  '/admin/seller-applications': {
    label: 'Aplicații Vânzători',
    parent: '/admin',
  },
  '/admin/products': {
    label: 'Produse',
    parent: '/admin',
  },
  '/admin/orders': {
    label: 'Comenzi',
    parent: '/admin',
  },
  '/admin/finante': {
    label: 'Finanțe',
    parent: '/admin',
  },
  '/admin/commissions': {
    label: 'Comisioane',
    parent: '/admin',
  },
  '/admin/payments': {
    label: 'Payments',
    parent: '/admin',
  },
  '/admin/webhooks': {
    label: 'Webhooks',
    parent: '/admin',
  },
  '/admin/security': {
    label: 'Security',
    parent: '/admin',
  },
  '/admin/security/audit': {
    label: 'Audit Logs',
    parent: '/admin/security',
  },
  '/admin/security/abuse': {
    label: 'Abuse',
    parent: '/admin/security',
  },
  '/admin/compliance': {
    label: 'Compliance',
    parent: '/admin',
  },
  '/admin/compliance/consents': {
    label: 'Consents',
    parent: '/admin/compliance',
  },
  '/admin/compliance/dsar': {
    label: 'DSAR',
    parent: '/admin/compliance',
  },
  '/admin/compliance/retention': {
    label: 'Retention',
    parent: '/admin/compliance',
  },
  '/admin/analytics': {
    label: 'Statistici',
    parent: '/admin',
  },
  '/admin/settings': {
    label: 'Setări',
    parent: '/admin',
  },
};

/**
 * Helper pentru a obține label-ul pentru o rută
 */
function getRouteLabel(pathname: string): string {
  // Verifică exact match
  if (ADMIN_ROUTE_CONFIG[pathname]) {
    return ADMIN_ROUTE_CONFIG[pathname].label;
  }

  // Verifică rute dinamice (ex: /admin/seller-applications/[id])
  if (pathname.startsWith('/admin/seller-applications/')) {
    return 'Detalii Aplicație';
  }
  if (pathname.startsWith('/admin/sellers/')) {
    return 'Detalii Seller';
  }
  if (pathname.startsWith('/admin/orders/')) {
    return 'Detalii Comandă';
  }
  if (pathname.startsWith('/admin/products/')) {
    return 'Detalii Produs';
  }

  // Fallback: capitalizează ultimul segment din path
  const segments = pathname.split('/').filter(Boolean);
  const lastSegment = segments[segments.length - 1];
  return lastSegment
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Generează breadcrumbs pe baza pathname-ului
 * Suportă rute nestate și dinamice
 */
export function generateAdminBreadcrumbs(pathname: string, customLabel?: string): BreadcrumbItem[] {
  const items: BreadcrumbItem[] = [];

  // Acasă este întotdeauna primul
  items.push({ name: 'Acasă', href: '/' });

  // Nu adăugăm breadcrumbs pentru pagina principală admin
  if (pathname === '/admin') {
    items.push({ name: 'Admin Dashboard', href: '/admin' });
    return items;
  }

  // Adăugăm Dashboard Admin
  items.push({ name: 'Admin', href: '/admin' });

  // Construim path-ul treptat
  const segments = pathname.split('/').filter(Boolean);
  let currentPath = '';

  for (let i = 0; i < segments.length; i++) {
    currentPath += `/${segments[i]}`;

    // Ignoră segmentul "admin" deja adăugat
    if (currentPath === '/admin') {
      continue;
    }

    // Pentru ultimul segment, folosește customLabel dacă este furnizat
    if (i === segments.length - 1 && customLabel) {
      items.push({ name: customLabel, href: currentPath });
      break;
    }

    // Verifică dacă este o rută cunoscută
    const config = ADMIN_ROUTE_CONFIG[currentPath];
    if (config) {
      items.push({ name: config.label, href: currentPath });
    } else {
      // Pentru rute dinamice sau necunoscute, generează label
      const label = getRouteLabel(currentPath);
      items.push({ name: label, href: currentPath });
    }
  }

  return items;
}

/**
 * Helper pentru a obține breadcrumbs pentru rute specifice (folosind configurația)
 */
export function getAdminBreadcrumbs(route: string, customLabel?: string): BreadcrumbItem[] {
  return generateAdminBreadcrumbs(route, customLabel);
}
