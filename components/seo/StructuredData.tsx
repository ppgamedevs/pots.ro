"use client";

import { useEffect } from "react";

export function StructuredData() {
  useEffect(() => {
    const structuredData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://floristmarket.ro/#organization",
          "name": "FloristMarket",
          "url": "https://floristmarket.ro",
          "logo": {
            "@type": "ImageObject",
            "url": "https://floristmarket.ro/logo.png",
            "width": 200,
            "height": 60
          },
          "description": "Marketplace de floristică din România",
          "address": {
            "@type": "PostalAddress",
            "addressCountry": "RO"
          },
          "contactPoint": {
            "@type": "ContactPoint",
            "telephone": "+40-XXX-XXX-XXX",
            "contactType": "customer service",
            "availableLanguage": "Romanian"
          },
          "sameAs": [
            "https://www.facebook.com/floristmarket",
            "https://www.instagram.com/floristmarket"
          ]
        },
        {
          "@type": "WebSite",
          "@id": "https://floristmarket.ro/#website",
          "url": "https://floristmarket.ro",
          "name": "FloristMarket",
          "description": "Marketplace de floristică din România",
          "publisher": {
            "@id": "https://floristmarket.ro/#organization"
          },
          "potentialAction": [
            {
              "@type": "SearchAction",
              "target": {
                "@type": "EntryPoint",
                "urlTemplate": "https://floristmarket.ro/search?q={search_term_string}"
              },
              "query-input": "required name=search_term_string"
            }
          ]
        },
        {
          "@type": "WebPage",
          "@id": "https://floristmarket.ro/#webpage",
          "url": "https://floristmarket.ro",
          "name": "FloristMarket – Marketplace de floristică",
          "isPartOf": {
            "@id": "https://floristmarket.ro/#website"
          },
          "about": {
            "@id": "https://floristmarket.ro/#organization"
          },
          "description": "Descoperă cel mai mare marketplace de floristică din România. Ghivece, cutii, ambalaje și accesorii de calitate de la selleri verificați."
        },
        {
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Acasă",
              "item": "https://floristmarket.ro"
            }
          ]
        }
      ]
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.text = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  return null;
}
