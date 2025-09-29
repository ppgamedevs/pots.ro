import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export const CART_COOKIE_NAME = "cartId";

export async function getCartId(): Promise<string> {
  const cookieStore = await cookies();
  let cartId = cookieStore.get(CART_COOKIE_NAME)?.value;
  
  if (!cartId) {
    cartId = randomUUID();
  }
  
  return cartId;
}

export async function setCartIdCookie(cartId: string) {
  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE_NAME, cartId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });
}
