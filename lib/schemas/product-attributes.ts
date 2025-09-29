import { z } from "zod";

// Base attributes for all products
export const baseProductAttributesSchema = z.object({
  // Price and stock
  price_cents: z.number().int().min(0),
  stock_qty: z.number().int().min(0).default(0),
  is_in_stock: z.boolean().default(false),
  
  // Basic info
  brand: z.string().optional(),
  vendor_id: z.number().int().positive(),
  
  // Visual attributes
  material: z.enum([
    "ceramic", "porcelain", "glass", "plastic", "metal", "wood", 
    "concrete", "terracotta", "cardboard", "textile"
  ]).optional(),
  color: z.enum([
    "white", "black", "natural", "red", "green", "blue", "pink", 
    "purple", "brown", "gray", "gold", "silver"
  ]).optional(),
  finish: z.enum(["matte", "glossy", "satin", "textured", "painted", "natural"]).optional(),
  style: z.enum(["modern", "classic", "rustic", "boho", "minimalist"]).optional(),
  shape: z.enum([
    "round", "square", "rectangle", "conic", "cylinder", "hexagon", "heart"
  ]).optional(),
  
  // Size attributes
  size_label: z.enum(["XS", "S", "M", "L", "XL"]).optional(),
  diameter_mm: z.number().int().positive().optional(),
  height_mm: z.number().int().positive().optional(),
  length_mm: z.number().int().positive().optional(),
  volume_l: z.number().positive().optional(),
  weight_kg: z.number().positive().optional(),
  
  // Set and collection
  set_size: z.number().int().positive().optional(),
  collection: z.string().optional(),
  tags: z.array(z.string()).default([]),
  
  // Metadata
  created_at: z.string().datetime(),
  popularity_score: z.number().int().min(0).default(0),
});

// Pottery/Vase specific attributes
export const potteryAttributesSchema = baseProductAttributesSchema.extend({
  drainage_hole: z.boolean().default(false),
  saucer_included: z.boolean().default(false),
  indoor_outdoor: z.enum(["indoor", "outdoor", "both"]).default("indoor"),
  uv_resistant: z.boolean().default(false),
  frost_resistant: z.boolean().default(false),
  waterproof: z.boolean().default(false),
  glaze: z.enum(["transparent", "opaque", "crackle"]).optional(),
  pattern: z.enum(["solid", "stripes", "floral", "geometric", "marble"]).optional(),
});

// Floral boxes specific attributes
export const floralBoxAttributesSchema = baseProductAttributesSchema.extend({
  series: z.string().optional(),
  coating: z.enum(["matte", "glossy"]).optional(),
  personalizable: z.boolean().default(false),
  ribbon_included: z.boolean().default(false),
  tall_or_normal: z.enum(["tall", "normal"]).optional(),
  painted: z.boolean().default(false),
});

// Accessories specific attributes
export const accessoriesAttributesSchema = baseProductAttributesSchema.extend({
  compatibility: z.array(z.enum(["bouquet", "box", "wreath", "centerpiece"])).default([]),
  pack_units: z.number().int().positive().default(1),
  food_safe: z.boolean().default(false),
  eco_cert: z.string().optional(),
});

// Union type for all product attributes
export type BaseProductAttributes = z.infer<typeof baseProductAttributesSchema>;
export type PotteryAttributes = z.infer<typeof potteryAttributesSchema>;
export type FloralBoxAttributes = z.infer<typeof floralBoxAttributesSchema>;
export type AccessoriesAttributes = z.infer<typeof accessoriesAttributesSchema>;

export type ProductAttributes = 
  | BaseProductAttributes 
  | PotteryAttributes 
  | FloralBoxAttributes 
  | AccessoriesAttributes;

// Product type with attributes
export interface Product {
  id: string | number;
  slug: string;
  title: string;
  category_slug: string;
  description?: string;
  imageUrl: string;
  sellerSlug?: string;
  attributes: ProductAttributes;
}

// Stock status for badges
export type StockStatus = "in_stock" | "limited_stock" | "out_of_stock";

export function getStockStatus(stockQty: number, threshold: number = 5): StockStatus {
  if (stockQty === 0) return "out_of_stock";
  if (stockQty <= threshold) return "limited_stock";
  return "in_stock";
}

// Stock badge configuration
export const stockBadgeConfig = {
  in_stock: {
    variant: "success" as const,
    label: "În stoc",
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300"
  },
  limited_stock: {
    variant: "warning" as const,
    label: "Stoc limitat",
    className: "bg-amber-100 text-amber-800 dark:bg-amber-400/10 dark:text-amber-300"
  },
  out_of_stock: {
    variant: "destructive" as const,
    label: "Stoc epuizat",
    className: "bg-rose-100 text-rose-700 dark:bg-rose-400/10 dark:text-rose-300"
  }
} as const;
