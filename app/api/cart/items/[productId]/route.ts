import { NextResponse } from "next/server";
import { getCartId, setCartIdCookie } from "@/lib/cart-utils";
import { cacheHeaders } from "@/lib/http";
import type { Cart } from "@/lib/types";

// Mock in-memory storage for cart data
const cartStorage: Record<string, Cart> = {};

export async function PATCH(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = Number(params.productId);
    const body = await request.json();
    const { qty } = body;

    if (!Number.isInteger(productId) || !Number.isInteger(qty) || qty < 1 || qty > 99) {
      return NextResponse.json(
        { error: "Invalid productId or qty" },
        { status: 400 }
      );
    }

    const cartId = getCartId();
    const cart = cartStorage[cartId];
    
    if (!cart) {
      return NextResponse.json(
        { error: "Cart not found" },
        { status: 404 }
      );
    }

    // Find item in cart
    const itemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (itemIndex === -1) {
      return NextResponse.json(
        { error: "Item not found in cart" },
        { status: 404 }
      );
    }

    // Update quantity
    cart.items[itemIndex].qty = qty;

    // Calculate subtotal
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    // Save cart
    cartStorage[cartId] = cart;
    setCartIdCookie(cartId);
    
    return NextResponse.json(cart, { headers: { ...cacheHeaders } });
    
  } catch (error) {
    console.error('Cart item PATCH error:', error);
    return NextResponse.json(
      { error: "Failed to update item quantity" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const productId = Number(params.productId);

    if (!Number.isInteger(productId)) {
      return NextResponse.json(
        { error: "Invalid productId" },
        { status: 400 }
      );
    }

    const cartId = getCartId();
    const cart = cartStorage[cartId];
    
    if (!cart) {
      return NextResponse.json(
        { error: "Cart not found" },
        { status: 404 }
      );
    }

    // Remove item from cart
    cart.items = cart.items.filter(item => item.productId !== productId);

    // Calculate subtotal
    cart.subtotal = cart.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    
    // Save cart
    cartStorage[cartId] = cart;
    setCartIdCookie(cartId);
    
    return NextResponse.json(cart, { headers: { ...cacheHeaders } });
    
  } catch (error) {
    console.error('Cart item DELETE error:', error);
    return NextResponse.json(
      { error: "Failed to remove item from cart" },
      { status: 500 }
    );
  }
}
