"use client";
import Head from "next/head";
import { useSearchParams } from "next/navigation";

interface CanonicalUrlProps {
  baseUrl: string;
  pathname: string;
  excludeParams?: string[];
}

export function CanonicalUrl({ 
  baseUrl, 
  pathname, 
  excludeParams = [] 
}: CanonicalUrlProps) {
  const searchParams = useSearchParams();
  
  // Build canonical URL with only relevant parameters
  const canonicalParams = new URLSearchParams();
  
  // Only include SEO-relevant parameters
  const seoParams = ['page', 'sort', 'category', 'brand'];
  
  searchParams.forEach((value, key) => {
    if (seoParams.includes(key) && !excludeParams.includes(key)) {
      canonicalParams.set(key, value);
    }
  });
  
  const canonicalUrl = `${baseUrl}${pathname}${canonicalParams.toString() ? `?${canonicalParams.toString()}` : ""}`;
  
  return (
    <Head>
      <link rel="canonical" href={canonicalUrl} />
    </Head>
  );
}
