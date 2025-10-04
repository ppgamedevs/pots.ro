"use client";

export interface Attribute {
  label: string;
  value: string;
}

export interface PDPSpecsProps {
  description: string;
  attributes: Attribute[];
}

export function PDPSpecs({ description, attributes }: PDPSpecsProps) {
  return (
    <div className="space-y-6">
      {/* Description */}
      <div>
        <h3 className="text-xl font-semibold text-ink mb-4">Descriere</h3>
        <div className="prose prose-sm max-w-none text-muted leading-relaxed">
          <p>{description}</p>
        </div>
      </div>

      {/* Specifications */}
      {attributes.length > 0 && (
        <div>
          <h3 className="text-xl font-semibold text-ink mb-4">Specificații</h3>
          <div className="space-y-3">
            {attributes.map((attr, index) => (
              <div 
                key={index}
                className="flex justify-between py-3 border-b border-line last:border-b-0"
              >
                <span className="text-sm font-medium text-muted">
                  {attr.label}
                </span>
                <span className="text-sm text-ink text-right max-w-[60%]">
                  {attr.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Info */}
      <div className="pt-6 border-t border-line">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted">
          <div>
            <h4 className="font-medium text-ink mb-2">Materiale</h4>
            <p>Produse din materiale de calitate, durabile și eco-friendly</p>
          </div>
          
          <div>
            <h4 className="font-medium text-ink mb-2">Îngrijire</h4>
            <p>Instrucțiuni de îngrijire incluse cu fiecare produs</p>
          </div>
          
          <div>
            <h4 className="font-medium text-ink mb-2">Garantie</h4>
            <p>Garantie de calitate pentru toate produsele</p>
          </div>
          
          <div>
            <h4 className="font-medium text-ink mb-2">Suport</h4>
            <p>Echipa noastră este disponibilă pentru întrebări</p>
          </div>
        </div>
      </div>
    </div>
  );
}
