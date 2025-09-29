export type ProductCard = {
  id: number;
  slug: string;
  title: string;
  price: number;           // în unitatea currency (ex: 129.99)
  currency: "RON" | "EUR";
  image: string;           // URL absolut sau relativ
  sellerSlug: string;      // folosit intern; nu expune denumirea legală
};

export type Category = {
  id: number;
  slug: string;
  name: string;
  parentId: number | null;
};

export type SellerPublic = {
  slug: string;
  brandName: string;
  logoUrl: string | null;
  bannerUrl: string | null;
};

// Extended product type for detailed view
export type Product = ProductCard & {
  images: Array<{ url: string; alt: string }>;
  descriptionHtml: string;
  attributes: Record<string, any>;
  stockQty: number;
  category?: string;
  shortDescription?: string;
  seoDescription?: string;
};

// Seller product type for forms
export type SellerProduct = {
  id?: number;
  title: string;
  price: number;
  currency: "RON" | "EUR";
  stockQty: number;
  categorySlug: string;
  attributes: Record<string, any>;
  descriptionHtml: string;
  images: Array<{ url: string; alt: string }>;
  status: "draft" | "active" | "unpublished";
  createdAt?: string;
  updatedAt?: string;
};

// Seller product list item
export type SellerProductListItem = {
  id: number;
  title: string;
  price: number;
  currency: "RON" | "EUR";
  image: string;
  status: "draft" | "active" | "unpublished";
  stockQty: number;
  categorySlug: string;
  updatedAt: string;
};

// API response types
export type CategoryProductsResponse = {
  items: ProductCard[];
  nextCursor?: string;
};

export type SellerProductsResponse = {
  items: SellerProductListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// Product DTOs
export type ProductInput = {
  title: string;
  price: number;
  currency: "RON" | "EUR";
  stockQty: number;
  categorySlug: string;
  attributes: Record<string, any>;
  descriptionHtml: string;
  images: Array<{ url: string; alt: string }>;
  status: "draft" | "active" | "unpublished";
};

export type ProductPublic = {
  id: number;
  slug: string;
  title: string;
  price: number;
  currency: "RON" | "EUR";
  image: string;
  images: Array<{ url: string; alt: string }>;
  descriptionHtml: string;
  attributes: Record<string, any>;
  stockQty: number;
  category?: string;
  shortDescription?: string;
  seoDescription?: string;
  sellerSlug: string;
  createdAt: string;
  updatedAt: string;
};

// Cart types
export type CartItem = {
  productId: number;
  title: string;
  price: number;
  currency: "RON" | "EUR";
  image: string;
  qty: number;
};

export type Cart = {
  id: string;
  items: CartItem[];
  subtotal: number;
  currency: "RON" | "EUR";
};

// Image URL convention helper
export function buildProductImageUrl(
  sellerId: number,
  productId: number,
  timestamp: number,
  slug: string,
  extension: string = 'jpg'
): string {
  return `product-images/seller-${sellerId}/${productId}/${timestamp}-${slug}.${extension}`;
}
