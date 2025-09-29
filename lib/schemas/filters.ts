import { z } from "zod";

// Filter schema for search parameters
export const filtersSchema = z.object({
  // Search
  q: z.string().optional(),
  
  // Price filters
  min_price: z.coerce.number().int().min(0).optional(),
  max_price: z.coerce.number().int().min(0).optional(),
  
  // Basic filters
  color: z.array(z.string()).optional(),
  material: z.array(z.string()).optional(),
  shape: z.array(z.string()).optional(),
  style: z.array(z.string()).optional(),
  finish: z.array(z.string()).optional(),
  
  // Stock
  in_stock: z.coerce.boolean().optional(),
  
  // Vendor and collection
  vendor: z.array(z.string()).optional(),
  set_size: z.array(z.coerce.number().int()).optional(),
  collection: z.array(z.string()).optional(),
  
  // Dimensions
  min_diameter: z.coerce.number().int().optional(),
  max_diameter: z.coerce.number().int().optional(),
  min_height: z.coerce.number().int().optional(),
  max_height: z.coerce.number().int().optional(),
  
  // Pottery specific
  indoor_outdoor: z.array(z.enum(["indoor", "outdoor", "both"])).optional(),
  drainage_hole: z.coerce.boolean().optional(),
  saucer_included: z.coerce.boolean().optional(),
  uv_resistant: z.coerce.boolean().optional(),
  
  // Floral boxes specific
  tall_or_normal: z.array(z.enum(["tall", "normal"])).optional(),
  painted: z.array(z.enum(["true", "false"])).optional(),
  personalizable: z.coerce.boolean().optional(),
  
  // Sorting
  sort: z.enum(["price_asc", "price_desc", "popularity_desc", "newest"]).optional(),
  
  // Pagination
  limit: z.coerce.number().int().min(1).max(48).optional(),
  cursor: z.string().optional(),
  
  // Legacy pagination (for backward compatibility)
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(60).optional(),
});

export type Filters = z.infer<typeof filtersSchema>;

// Parse search params into filters
export function parseFilters(searchParams: Record<string, string | string[] | undefined>): Filters {
  const parsed: Record<string, any> = {};
  
  for (const [key, value] of Object.entries(searchParams)) {
    if (value === undefined) continue;
    
    // Handle array parameters
    if (key === 'color' || key === 'material' || key === 'shape' || 
        key === 'style' || key === 'finish' || key === 'vendor' || 
        key === 'collection' || key === 'indoor_outdoor' || 
        key === 'tall_or_normal' || key === 'painted') {
      parsed[key] = Array.isArray(value) ? value : [value];
    } else if (key === 'set_size') {
      parsed[key] = Array.isArray(value) ? value.map(Number) : [Number(value)];
    } else {
      parsed[key] = value;
    }
  }
  
  return filtersSchema.parse(parsed);
}

// Build URL search params from filters
export function buildSearchParams(filters: Partial<Filters>): URLSearchParams {
  const params = new URLSearchParams();
  
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined || value === null) continue;
    
    if (Array.isArray(value)) {
      value.forEach(v => params.append(key, String(v)));
    } else {
      params.set(key, String(value));
    }
  }
  
  return params;
}

// Default filter values
export const defaultFilters: Filters = {
  sort: "popularity_desc",
  limit: 24,
  in_stock: true,
};

// Available filter options for UI
export const filterOptions = {
  colors: [
    "white", "black", "natural", "red", "green", "blue", 
    "pink", "purple", "brown", "gray", "gold", "silver"
  ],
  materials: [
    "ceramic", "porcelain", "glass", "plastic", "metal", 
    "wood", "concrete", "terracotta", "cardboard", "textile"
  ],
  shapes: [
    "round", "square", "rectangle", "conic", "cylinder", 
    "hexagon", "heart"
  ],
  styles: [
    "modern", "classic", "rustic", "boho", "minimalist"
  ],
  finishes: [
    "matte", "glossy", "satin", "textured", "painted", "natural"
  ],
  indoorOutdoor: [
    "indoor", "outdoor", "both"
  ],
  tallOrNormal: [
    "tall", "normal"
  ],
  painted: [
    "true", "false"
  ],
  sortOptions: [
    { value: "popularity_desc", label: "Cele mai populare" },
    { value: "price_asc", label: "Preț crescător" },
    { value: "price_desc", label: "Preț descrescător" },
    { value: "newest", label: "Cele mai noi" },
  ]
} as const;
