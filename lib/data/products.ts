export type Image = { 
  url: string; 
  alt?: string; 
};

export type Product = {
  id: number;
  slug: string;
  title: string;
  price_cents: number;
  stock_qty: number;
  seo_description?: string;
  short_description?: string;
  description_html?: string;
  images: Image[];
  brand?: string;
  sku?: string;
  // atribute frecvente
  color?: string;
  material?: string;
  finish?: string;
  shape?: string;
  diameter_mm?: number;
  height_mm?: number;
  length_mm?: number;
  volume_l?: number;
  weight_kg?: number;
  set_size?: number;
  collection?: string;
  attributes?: Record<string, unknown>;
  // vendor
  sellerSlug?: string; // NU expunem public pe pagina produsului
};

// Mock data pentru produse
const mockProducts: Product[] = [
  {
    id: 1,
    slug: "ghiveci-ceramic-alb",
    title: "Ghiveci ceramic alb",
    price_cents: 4990,
    stock_qty: 15,
    short_description: "Ghiveci ceramic cu finisaj mat, potrivit pentru plante de interior.",
    description_html: `
      <p>Ghiveci ceramic de calitate superioară, realizat manual în atelierul nostru. 
      Finisajul mat oferă un aspect elegant și modern, perfect pentru orice decor.</p>
      <p><strong>Caracteristici:</strong></p>
      <ul>
        <li>Material: ceramică de calitate</li>
        <li>Finisaj: mat, texturat</li>
        <li>Gaură de drenaj: da</li>
        <li>Potrivit pentru: plante de interior</li>
        <li>Îngrijire: spălare manuală cu apă caldă</li>
      </ul>
    `,
    images: [
      { 
        url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop&crop=center", 
        alt: "Ghiveci ceramic alb - vedere frontală" 
      },
      { 
        url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop&crop=center", 
        alt: "Ghiveci ceramic alb - detaliu finisaj" 
      },
      { 
        url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=800&fit=crop&crop=center", 
        alt: "Ghiveci ceramic alb - în context" 
      },
      { 
        url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=800&fit=crop&crop=center", 
        alt: "Ghiveci ceramic alb - cu plantă" 
      },
    ],
    color: "white",
    material: "ceramic",
    finish: "matte",
    shape: "round",
    diameter_mm: 200,
    height_mm: 150,
    brand: "Pots Studio",
    sku: "POTS-GHI-001",
    attributes: { 
      drainage_hole: true, 
      saucer_included: false,
      indoor_outdoor: "indoor",
      uv_resistant: false,
      frost_resistant: false
    },
    sellerSlug: "atelier-ceramic",
  },
  {
    id: 2,
    slug: "vaza-sticla-inalta",
    title: "Vază sticlă înaltă",
    price_cents: 8990,
    stock_qty: 8,
    short_description: "Vază din sticlă transparentă, perfectă pentru aranjamente florale moderne.",
    description_html: `
      <p>Vază elegantă din sticlă de calitate superioară, realizată prin suflare manuală. 
      Designul minimalist se potrivește perfect în orice spațiu modern.</p>
      <p><strong>Caracteristici:</strong></p>
      <ul>
        <li>Material: sticlă transparentă de calitate</li>
        <li>Proces: suflare manuală</li>
        <li>Formă: cilindrică înaltă</li>
        <li>Potrivit pentru: flori tăiate, aranjamente</li>
        <li>Îngrijire: spălare în mașină de vase</li>
      </ul>
    `,
    images: [
      { 
        url: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800&h=800&fit=crop&crop=center", 
        alt: "Vază sticlă înaltă - vedere frontală" 
      },
      { 
        url: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=800&fit=crop&crop=center", 
        alt: "Vază sticlă înaltă - detaliu" 
      },
      { 
        url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=800&fit=crop&crop=center", 
        alt: "Vază sticlă înaltă - cu flori" 
      },
    ],
    color: "natural",
    material: "glass",
    finish: "glossy",
    shape: "cylinder",
    diameter_mm: 120,
    height_mm: 300,
    brand: "Glass Art",
    sku: "POTS-VAZ-002",
    attributes: { 
      indoor_outdoor: "indoor",
      food_safe: true,
      dishwasher_safe: true
    },
    sellerSlug: "glass-art",
  },
  {
    id: 3,
    slug: "cutie-florala-natur",
    title: "Cutie florală natur",
    price_cents: 2590,
    stock_qty: 3,
    short_description: "Cutie din carton reciclat, perfectă pentru aranjamente florale rustice.",
    description_html: `
      <p>Cutie florală din carton reciclat de calitate, cu design rustic și natural. 
      Ideală pentru aranjamente de flori sau ca decor în casă.</p>
      <p><strong>Caracteristici:</strong></p>
      <ul>
        <li>Material: carton reciclat</li>
        <li>Finisaj: natur, mat</li>
        <li>Formă: dreptunghiulară</li>
        <li>Personalizabil: da</li>
        <li>Eco-friendly: da</li>
      </ul>
    `,
    images: [
      { 
        url: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=800&h=800&fit=crop&crop=center", 
        alt: "Cutie florală natur - vedere frontală" 
      },
      { 
        url: "https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=800&h=800&fit=crop&crop=center", 
        alt: "Cutie florală natur - cu flori" 
      },
    ],
    color: "natural",
    material: "cardboard",
    finish: "matte",
    shape: "rectangle",
    length_mm: 300,
    height_mm: 200,
    brand: "Eco Design",
    sku: "POTS-CUT-003",
    attributes: { 
      tall_or_normal: "normal",
      painted: false,
      personalizable: true,
      eco_cert: "FSC",
      recyclable: true
    },
    sellerSlug: "cardboard-street",
  },
];

export async function getProductById(id: number): Promise<Product | null> {
  // Simulare delay pentru realitate
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return mockProducts.find(p => p.id === id) || null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  // Simulare delay pentru realitate
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return mockProducts.find(p => p.slug === slug) || null;
}

export async function getProductsBySeller(sellerSlug: string): Promise<Product[]> {
  // Simulare delay pentru realitate
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return mockProducts.filter(p => p.sellerSlug === sellerSlug);
}