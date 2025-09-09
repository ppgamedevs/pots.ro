import { Metadata } from "next";

const products = {
  "1-ghiveci-ceramic-alb": {
    title: "Ghiveci ceramic alb",
    description: "Ghiveci ceramic alb de calitate superioară, perfect pentru plante de interior. Design modern și elegant.",
    price: 49.9,
  },
  "2-cutie-inalta-nevopsita": {
    title: "Cutie înaltă natur",
    description: "Cutie înaltă din carton reciclat, perfectă pentru aranjamente florale înalte. Design clasic și elegant.",
    price: 79.0,
  }
};

export async function generateMetadata({ params }: { params: { id: string; slug: string } }): Promise<Metadata> {
  const productId = `${params.id}-${params.slug}`;
  const product = products[productId as keyof typeof products];
  
  if (!product) {
    return {
      title: "Produs nu există | Pots.ro",
      description: "Produsul pe care îl căutați nu există.",
    };
  }

  return {
    title: `${product.title} | Pots.ro`,
    description: product.description,
    openGraph: {
      title: `${product.title} | Pots.ro`,
      description: product.description,
      type: "website",
      images: ["/placeholder.svg"],
    },
  };
}

export default function ProductLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
