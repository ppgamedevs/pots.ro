import { redirect } from "next/navigation";

export default function CheckoutSuccessRedirect() {
  redirect("/finalizare/success");
}


