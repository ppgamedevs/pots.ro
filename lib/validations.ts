import { z } from "zod";

// User schemas
export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['buyer', 'seller', 'admin']).default('buyer'),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Seller schemas
export const createSellerSchema = z.object({
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  brandName: z.string().min(1).max(100),
  about: z.string().max(1000).optional(),
});

export const updateSellerSchema = createSellerSchema.partial();

// Category schemas
export const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  parentId: z.string().uuid().optional(),
  position: z.number().int().min(0).default(0),
});

export const updateCategorySchema = createCategorySchema.partial();

// Product schemas
export const createProductSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  priceCents: z.number().int().min(0),
  currency: z.string().length(3).default('RON'),
  stock: z.number().int().min(0).default(0),
  categoryId: z.string().uuid().optional(),
  attributes: z.record(z.string(), z.any()).default({}),
});

export const updateProductSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional(),
  priceCents: z.number().int().min(0).optional(),
  currency: z.string().length(3).optional(),
  stock: z.number().int().min(0).optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  categoryId: z.string().uuid().optional(),
  attributes: z.record(z.string(), z.any()).optional(),
  imageUrl: z.string().url().optional(),
});

// Product image schemas
export const createProductImageSchema = z.object({
  productId: z.string().uuid(),
  url: z.string().url(),
  alt: z.string().max(200).optional(),
  position: z.number().int().min(0).default(0),
});

export const updateProductImageSchema = z.object({
  url: z.string().url().optional(),
  alt: z.string().max(200).optional(),
  position: z.number().int().min(0).optional(),
});

// Seller page schemas
export const updateSellerPageSchema = z.object({
  aboutMd: z.string().max(5000).optional(),
  seoTitle: z.string().max(100).optional(),
  seoDesc: z.string().max(200).optional(),
});

// Upload schemas
export const uploadPrepareSchema = z.object({
  filename: z.string().min(1).max(100),
  contentType: z.string().optional(),
});

// Search schema
export const searchSchema = z.object({
  q: z.string().min(1).max(100),
});

// Query schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const productFiltersSchema = z.object({
  categoryId: z.string().uuid().optional(),
  sellerId: z.string().uuid().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
}).merge(paginationSchema);

