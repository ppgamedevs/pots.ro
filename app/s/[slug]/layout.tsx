import { Metadata } from "next";

const sellers = {
  "atelier-ceramic": {
    name: "Atelier Ceramic",
    description: "Specializați în ceramică artizanală de calitate superioară. Peste 10 ani de experiență în crearea de ghivece unice și durabile.",
  },
  "cardboard-street": {
    name: "Cardboard Street",
    description: "Producători de cutii și ambalaje eco-friendly. Ne specializăm în soluții creative și durabile pentru industria florală.",
  }
};

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const seller = sellers[params.slug as keyof typeof sellers];
  
  if (!seller) {
    return {
      title: "Vânzător nu există | Pots.ro",
      description: "Vânzătorul pe care îl căutați nu există.",
    };
  }

  return {
    title: `${seller.name} | Pots.ro`,
    description: seller.description,
    openGraph: {
      title: `${seller.name} | Pots.ro`,
      description: seller.description,
      type: "profile",
    },
  };
}

export default function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
