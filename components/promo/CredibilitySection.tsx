import { CheckCircle, Shield, Truck, Users } from "lucide-react";

const credibilityItems = [
  {
    icon: Shield,
    title: "Plăți securizate",
    description: "Toate tranzacțiile sunt protejate cu criptare SSL"
  },
  {
    icon: CheckCircle,
    title: "Selleri verificați",
    description: "Fiecare vânzător este verificat și evaluat de comunitate"
  },
  {
    icon: Truck,
    title: "Livrare rapidă",
    description: "Livrare în 24-48h din depozitele noastre"
  },
  {
    icon: Users,
    title: "Suport dedicat",
    description: "Echipa noastră este disponibilă pentru orice întrebare"
  }
];

export function CredibilitySection() {
  return (
    <section className="py-12 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            De ce să alegi FloristMarket?
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Peste 5000 de florării ne-au ales pentru calitatea produselor și serviciilor noastre
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {credibilityItems.map((item, index) => (
            <div key={index} className="text-center group">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4 group-hover:bg-primary/20 transition-colors">
                <item.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {item.title}
              </h3>
              <p className="text-gray-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <div className="inline-flex items-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>5000+ florării active</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>50.000+ produse</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>99% satisfacție</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
