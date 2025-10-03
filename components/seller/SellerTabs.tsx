"use client";
import { useState } from "react";
import { UITabs } from "@/components/ui/tabs";
import { ProductGrid } from "@/components/ui/product-grid";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSanitize from "rehype-sanitize";

type Product = {
  id: string | number;
  slug: string;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  sellerSlug: string;
  attributes: any;
};

type SellerTabsProps = {
  products: Product[];
  aboutMd?: string;
};

export function SellerTabs({ products, aboutMd }: SellerTabsProps) {
  const tabs = [
    {
      value: "products",
      label: `Produse (${products.length})`,
      content: products.length > 0 ? (
        <ProductGrid products={products} columns={3} />
      ) : (
        <div className="text-center py-12">
          <div className="text-slate-500 dark:text-slate-400 mb-4">
            Acest partener nu are produse disponibile momentan.
          </div>
        </div>
      ),
    },
    {
      value: "about",
      label: "Despre",
      content: (
        <div className="prose prose-slate dark:prose-invert max-w-none">
          {aboutMd ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeSanitize]}
              components={{
                a: ({ href, children, ...props }) => {
                  // Check if it's an external link
                  const isExternal = href?.startsWith('http') && !href?.includes('floristmarket.ro');
                  
                  return (
                    <a
                      href={href}
                      rel={isExternal ? "nofollow noopener" : undefined}
                      target={isExternal ? "_blank" : undefined}
                      className="text-brand hover:text-brand-dark underline"
                      {...props}
                    >
                      {children}
                    </a>
                  );
                },
              }}
            >
              {aboutMd}
            </ReactMarkdown>
          ) : (
            <div className="text-slate-500 dark:text-slate-400">
              Informații despre acest partener nu sunt disponibile momentan.
            </div>
          )}
        </div>
      ),
    },
  ];

  return <UITabs defaultValue="products" tabs={tabs} className="w-full" />;
}
