import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";

interface Merchant {
  name: string;
  cui: string;
}

interface MerchantDisclosureProps {
  merchant: Merchant;
}

export default function MerchantDisclosure({ merchant }: MerchantDisclosureProps) {
  return (
    <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <div className="font-medium mb-2">Informații despre comerciant</div>
            <p>
              Comanda conține produse vândute de: <strong>{merchant.name}</strong> (CUI {merchant.cui}).
              <br />
              Plasând comanda, accepți ca Pots să gestioneze plata, livrarea și retururile în numele comerciantului.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
