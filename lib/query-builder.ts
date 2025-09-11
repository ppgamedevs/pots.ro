import { Filters } from "./schemas/filters";
import { Product } from "./schemas/product-attributes";

// Mock database query builder (replace with actual Prisma/Supabase)
export interface QueryOptions {
  where: Record<string, any>;
  orderBy: Array<Record<string, string>>;
  limit: number;
  cursor?: string;
}

export interface QueryResult<T> {
  items: T[];
  nextCursor?: string;
  totalCount: number;
  hasMore: boolean;
}

// Build WHERE clause from filters
export function buildWhereClause(filters: Filters): Record<string, any> {
  const where: Record<string, any> = {};

  // Price filters
  if (filters.min_price || filters.max_price) {
    where.price_cents = {};
    if (filters.min_price) where.price_cents.gte = filters.min_price;
    if (filters.max_price) where.price_cents.lte = filters.max_price;
  }

  // Stock filter
  if (filters.in_stock === true) {
    where.is_in_stock = true;
  }

  // Basic selectors
  if (filters.color?.length) where.color = { in: filters.color };
  if (filters.material?.length) where.material = { in: filters.material };
  if (filters.shape?.length) where.shape = { in: filters.shape };
  if (filters.style?.length) where.style = { in: filters.style };
  if (filters.finish?.length) where.finish = { in: filters.finish };
  if (filters.vendor?.length) where.vendor_id = { in: filters.vendor.map(Number).filter(Boolean) };
  if (filters.collection?.length) where.collection = { in: filters.collection };
  if (filters.set_size?.length) where.set_size = { in: filters.set_size };

  // Dimensions
  if (filters.min_diameter || filters.max_diameter) {
    where.diameter_mm = {};
    if (filters.min_diameter) where.diameter_mm.gte = filters.min_diameter;
    if (filters.max_diameter) where.diameter_mm.lte = filters.max_diameter;
  }
  if (filters.min_height || filters.max_height) {
    where.height_mm = {};
    if (filters.min_height) where.height_mm.gte = filters.min_height;
    if (filters.max_height) where.height_mm.lte = filters.max_height;
  }

  // Pottery specific filters
  if (filters.indoor_outdoor?.length) {
    where.indoor_outdoor = { in: filters.indoor_outdoor };
  }
  if (typeof filters.drainage_hole === "boolean") {
    where.drainage_hole = filters.drainage_hole;
  }
  if (typeof filters.saucer_included === "boolean") {
    where.saucer_included = filters.saucer_included;
  }
  if (typeof filters.uv_resistant === "boolean") {
    where.uv_resistant = filters.uv_resistant;
  }

  // Floral boxes specific filters
  if (filters.tall_or_normal?.length) {
    where.tall_or_normal = { in: filters.tall_or_normal };
  }
  if (filters.painted?.length) {
    const paintedValues = filters.painted.map(v => v === "true");
    where.painted = { in: paintedValues };
  }
  if (typeof filters.personalizable === "boolean") {
    where.personalizable = filters.personalizable;
  }

  return where;
}

// Build ORDER BY clause from sort option
export function buildOrderByClause(sort?: string): Array<Record<string, string>> {
  switch (sort) {
    case "price_asc":
      return [{ price_cents: "asc" }, { id: "desc" }];
    case "price_desc":
      return [{ price_cents: "desc" }, { id: "desc" }];
    case "newest":
      return [{ created_at: "desc" }, { id: "desc" }];
    case "popularity_desc":
    default:
      return [{ popularity_score: "desc" }, { created_at: "desc" }, { id: "desc" }];
  }
}

// Parse cursor for pagination
export function parseCursor(cursor?: string): { created_at: string; id: string } | null {
  if (!cursor) return null;
  
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
    const [created_at, id] = decoded.split(':');
    return { created_at, id };
  } catch {
    return null;
  }
}

// Generate next cursor
export function generateCursor(item: { created_at: string; id: string | number }): string {
  const cursor = `${item.created_at}:${item.id}`;
  return Buffer.from(cursor, 'utf-8').toString('base64');
}

// Build query options from filters
export function buildQueryOptions(filters: Filters): QueryOptions {
  const where = buildWhereClause(filters);
  const orderBy = buildOrderByClause(filters.sort);
  const limit = filters.limit || 24;
  const cursor = filters.cursor;

  return {
    where,
    orderBy,
    limit,
    cursor,
  };
}

// Mock query function (replace with actual database query)
export async function queryProducts(
  categorySlug: string,
  options: QueryOptions
): Promise<QueryResult<Product>> {
  // This is a mock implementation
  // In production, replace with actual database query
  
  const mockProducts: Product[] = Array.from({ length: 100 }, (_, i) => ({
    id: i + 1,
    slug: `${categorySlug}-${i + 1}`,
    title: `${categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1)} ${i + 1}`,
    category_slug: categorySlug,
    description: `Description for ${categorySlug} ${i + 1}`,
    imageUrl: `https://images.unsplash.com/photo-${1578662996442 + i}?w=400&h=400&fit=crop&crop=center`,
    sellerSlug: `seller-${(i % 3) + 1}`,
    attributes: {
      price_cents: Math.floor(5000 + Math.random() * 20000), // 50-250 RON
      stock_qty: Math.floor(Math.random() * 20),
      is_in_stock: Math.random() > 0.1, // 90% in stock
      vendor_id: (i % 3) + 1,
      material: ["ceramic", "glass", "plastic", "wood"][i % 4],
      color: ["white", "black", "natural", "red", "green", "blue"][i % 6],
      shape: ["round", "square", "rectangle", "conic"][i % 4],
      style: ["modern", "classic", "rustic", "minimalist"][i % 4],
      finish: ["matte", "glossy", "satin", "natural"][i % 4],
      diameter_mm: 100 + (i % 10) * 20,
      height_mm: 80 + (i % 15) * 10,
      set_size: i % 5 === 0 ? Math.floor(Math.random() * 5) + 1 : undefined,
      collection: i % 7 === 0 ? ["Premium", "Natur", "Classic"][i % 3] : undefined,
      tags: i % 3 === 0 ? ["cadou", "atelier"] : [],
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      popularity_score: Math.floor(Math.random() * 1000),
    } as any,
  }));

  // Apply filters (simplified mock implementation)
  let filteredProducts = mockProducts.filter(product => {
    // Category filter
    if (product.category_slug !== categorySlug) return false;
    
    // Price filter
    if (options.where.price_cents) {
      const { gte, lte } = options.where.price_cents;
      if (gte && product.attributes.price_cents < gte) return false;
      if (lte && product.attributes.price_cents > lte) return false;
    }
    
    // Stock filter
    if (options.where.is_in_stock && !product.attributes.is_in_stock) return false;
    
    // Color filter
    if (options.where.color?.in && !options.where.color.in.includes(product.attributes.color)) return false;
    
    // Material filter
    if (options.where.material?.in && !options.where.material.in.includes(product.attributes.material)) return false;
    
    return true;
  });

  // Apply sorting
  const orderBy = options.orderBy[0];
  if (orderBy) {
    const [field, direction] = Object.entries(orderBy)[0];
    filteredProducts.sort((a, b) => {
      let aVal = a.attributes[field as keyof typeof a.attributes];
      let bVal = b.attributes[field as keyof typeof b.attributes];
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return direction === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return direction === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });
  }

  // Apply cursor pagination
  if (options.cursor) {
    const cursorData = parseCursor(options.cursor);
    if (cursorData) {
      filteredProducts = filteredProducts.filter(product => {
        const productCreatedAt = new Date(product.attributes.created_at).toISOString();
        const productId = String(product.id);
        
        // For descending order (newest first)
        return productCreatedAt < cursorData.created_at || 
               (productCreatedAt === cursorData.created_at && productId < cursorData.id);
      });
    }
  }

  // Apply limit
  const items = filteredProducts.slice(0, options.limit);
  const hasMore = filteredProducts.length > options.limit;
  
  // Generate next cursor
  let nextCursor: string | undefined;
  if (hasMore && items.length > 0) {
    const lastItem = items[items.length - 1];
    nextCursor = generateCursor({
      created_at: lastItem.attributes.created_at,
      id: lastItem.id
    });
  }

  return {
    items,
    nextCursor,
    totalCount: filteredProducts.length,
    hasMore,
  };
}
