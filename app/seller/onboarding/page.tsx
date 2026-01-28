import { Metadata } from "next";
import SellerOnboardingClient from "./SellerOnboardingClient";

export const metadata: Metadata = {
  title: "Onboarding Vânzător - FloristMarket.ro",
  description: "Completează procesul de înregistrare ca vânzător pe FloristMarket.ro",
};

export default function SellerOnboardingPage() {
  return <SellerOnboardingClient />;
}
