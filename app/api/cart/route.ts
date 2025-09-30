import { NextResponse } from "next/server";
import { getCartId, setCartIdCookie } from "@/lib/cart-utils";
import { cacheHeaders } from "@/lib/http";
import type { Cart } from "@/lib/types";

// Mock in-memory storage for cart data
const cartStorage: Record<string, Cart> = {};

export async function GET() {
  try {
    const cartId = await getCartId();
    
    // Get or create cart
    let cart = cartStorage[cartId];
    
    if (!cart) {
      cart = {
        id: cartId,
        items: [],
        subtotal: 0,
        currency: "RON"
      };
      cartStorage[cartId] = cart;
    }
    
    // Calculate subtotal
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    // Set cookie if it doesn't exist
    await setCartIdCookie(cartId);
    
    return NextResponse.json(cart, { headers: { ...cacheHeaders } });
    
  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json(
      { error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}
