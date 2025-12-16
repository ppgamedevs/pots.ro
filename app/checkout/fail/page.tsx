import { redirect } from "next/navigation";

export default function CheckoutFailRedirect() {
  redirect("/finalizare/fail");
}


