import Image from "next/image";

const payments = [
  { name: "Visa", src: "/partners/payments/visa.svg" },
  { name: "Mastercard", src: "/partners/payments/mastercard.svg" },
  { name: "NETOPIA", src: "/partners/netopia.svg" },
];

export default function PaymentsStrip() {
  return (
    <div aria-label="Plăți securizate" className="bg-neutral-50 border-y border-neutral-200">
      <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between gap-6">
        <span className="text-sm text-neutral-600">Plăți securizate</span>
        <div className="flex items-center gap-6">
          {payments.map((p) => (
            <div key={p.name} className="relative h-6 w-16">
              <Image src={p.src} alt={p.name} fill sizes="64px" className="object-contain" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
