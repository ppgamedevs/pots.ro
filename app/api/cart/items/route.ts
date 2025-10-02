import { NextResponse } from "next/server";
import { getCartId, setCartIdCookie } from "@/lib/cart-utils";
import { cacheHeaders } from "@/lib/http";
import type { Cart, CartItem } from "@/lib/types";
import { apiGetProductById } from "@/lib/api-client";

export const dynamic = 'force-dynamic';

// Mock in-memory storage for cart data
const cartStorage: Record<string, Cart> = {};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, qty = 1 } = body;

    if (!productId || !Number.isInteger(productId) || qty < 1 || qty > 99) {
      return NextResponse.json(
        { error: "Invalid productId or qty" },
        { status: 400 }
      );
    }

    const cartId = await getCartId();
    
    // Get or create cart
    let cart = cartStorage[cartId];
    if (!cart) {
      cart = {
        id: cartId,
        items: [],
        totals: {
          subtotal: 0,
          shipping: 0,
          tax: 0,
          total: 0
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }

    // Fetch product details
    const product = await apiGetProductById(productId);
    
    // Check stock availability
    if (product.stockQty < qty) {
      return NextResponse.json(
        { error: "Insufficient stock", availableStock: product.stockQty },
        { status: 400 }
      );
    }

    // Check if item already exists in cart
    const existingItemIndex = cart.items.findIndex(item => item.productId === productId);
    
    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const newQty = Math.min(cart.items[existingItemIndex].qty + qty, 99);
      if (product.stockQty < newQty) {
        return NextResponse.json(
          { error: "Insufficient stock", availableStock: product.stockQty },
          { status: 400 }
        );
      }
      cart.items[existingItemIndex].qty = newQty;
    } else {
      // Add new item
      const cartItem: CartItem = {
        id: `${product.id}-${Date.now()}`, // Unique item ID
        productId: product.id,
        productName: product.title,
        qty: qty,
        unitPrice: product.price,
        subtotal: product.price * qty,
        sellerId: product.sellerId
      };
      cart.items.push(cartItem);
    }

    // Calculate totals
    cart.totals.subtotal = cart.items.reduce((sum, item) => sum + (item.unitPrice * item.qty), 0);
    cart.totals.shipping = 0; // Free shipping for MVP
    cart.totals.tax = Math.round(cart.totals.subtotal * 0.19); // 19% VAT
    cart.totals.total = cart.totals.subtotal + cart.totals.shipping + cart.totals.tax;
    cart.updatedAt = new Date().toISOString();
    
    // Save cart
    cartStorage[cartId] = cart;
    setCartIdCookie(cartId);
    
    return NextResponse.json(cart, { headers: { ...cacheHeaders } });
    
  } catch (error) {
    console.error('Cart items POST error:', error);
    return NextResponse.json(
      { error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}
