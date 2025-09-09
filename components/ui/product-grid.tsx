"use client";
import * as React from "react";
import { motion } from "framer-motion";
import { ProductCard } from "../product-card";
import { ProductCardSkeleton } from "./loading-skeleton";
import { fadeInUp } from "../motion";

export interface Product {
  id: string | number;
  slug: string;
  title: string;
  price: number;
  currency?: string;
  imageUrl: string;
  sellerSlug?: string;
}

export interface ProductGridProps {
  products: Product[];
  loading?: boolean;
  className?: string;
  columns?: 2 | 3 | 4;
}

const ProductGrid = React.forwardRef<HTMLDivElement, ProductGridProps>(
  ({ products, loading = false, className, columns = 3, ...props }, ref) => {
    const gridCols = {
      2: "sm:grid-cols-2",
      3: "sm:grid-cols-2 md:grid-cols-3",
      4: "sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
    };

    if (loading) {
      return (
        <div
          ref={ref}
          className={`grid gap-4 ${gridCols[columns]} ${className || ""}`}
          {...props}
        >
          {Array.from({ length: 8 }).map((_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={`grid gap-4 ${gridCols[columns]} ${className || ""}`}
        {...props}
      >
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.05 }}
          >
            <ProductCard {...product} />
          </motion.div>
        ))}
      </div>
    );
  }
);
ProductGrid.displayName = "ProductGrid";

export { ProductGrid };
