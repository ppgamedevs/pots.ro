"use client";

import { SITE_NAME, SITE_URL, SITE_DESCRIPTION } from "@/lib/constants";

export function StructuredData() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        "name": SITE_NAME,
        "url": SITE_URL,
        "logo": {
          "@type": "ImageObject",
          "url": `${SITE_URL}/favicon.svg`,
          "width": 512,
          "height": 512
        },
        "description": SITE_DESCRIPTION,
        "sameAs": [
          "https://www.facebook.com/floristmarketro",
          "https://www.instagram.com/floristmarketro",
          "https://twitter.com/floristmarketro"
        ],
        "contactPoint": {
          "@type": "ContactPoint",
          "contactType": "customer service",
          "availableLanguage": "Romanian"
        }
      },
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        "url": SITE_URL,
        "name": SITE_NAME,
        "description": SITE_DESCRIPTION,
        "publisher": {
          "@id": `${SITE_URL}/#organization`
        },
        "inLanguage": "ro-RO"
      },
      {
        "@type": "WebPage",
        "@id": `${SITE_URL}/#webpage`,
        "url": SITE_URL,
        "name": `${SITE_NAME} – Marketplace-ul profesioniștilor din floristică`,
        "isPartOf": {
          "@id": `${SITE_URL}/#website`
        },
        "about": {
          "@id": `${SITE_URL}/#organization`
        },
        "description": SITE_DESCRIPTION,
        "inLanguage": "ro-RO"
      },
      {
        "@type": "Store",
        "@id": `${SITE_URL}/#store`,
        "name": SITE_NAME,
        "description": "Marketplace online pentru produse de floristică",
        "url": SITE_URL,
        "telephone": "+40-XXX-XXX-XXX",
        "address": {
          "@type": "PostalAddress",
          "addressCountry": "RO",
          "addressLocality": "București"
        },
        "openingHours": "Mo-Fr 09:00-18:00",
        "paymentAccepted": ["Cash", "Credit Card", "Debit Card"],
        "currenciesAccepted": "RON"
      },
      {
        "@type": "ItemList",
        "name": "Categorii principale",
        "itemListElement": [
          {
            "@type": "ListItem",
            "position": 1,
            "name": "Ghivece",
            "url": `${SITE_URL}/c/ghivece`
          },
          {
            "@type": "ListItem",
            "position": 2,
            "name": "Cutii",
            "url": `${SITE_URL}/c/cutii`
          },
          {
            "@type": "ListItem",
            "position": 3,
            "name": "Ambalaje",
            "url": `${SITE_URL}/c/ambalaje`
          },
          {
            "@type": "ListItem",
            "position": 4,
            "name": "Accesorii",
            "url": `${SITE_URL}/c/accesorii`
          }
        ]
      }
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  );
}