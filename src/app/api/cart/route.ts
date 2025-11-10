import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import type { CartState, CartUpdateRequest, CartItem } from '@/lib/types/cart';

const CART_COOKIE_NAME = 'vendorsgg_cart';
const MAX_ITEMS = 100;

async function readCart(): Promise<CartState> {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(CART_COOKIE_NAME)?.value;
    if (!cookie) return { items: [] };
    const parsed = JSON.parse(cookie);
    if (!parsed || !Array.isArray(parsed.items)) return { items: [] };
    return parsed as CartState;
  } catch {
    return { items: [] };
  }
}

async function writeCart(state: CartState) {
  const payload = JSON.stringify({ ...state, updatedAt: new Date().toISOString() });
  const cookieStore = await cookies();
  cookieStore.set(CART_COOKIE_NAME, payload, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24, // 1 day
  });
}

export async function GET() {
  const cart = await readCart();
  return NextResponse.json(cart);
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CartUpdateRequest;
    const cart = await readCart();

    switch (body.action) {
      case 'add': {
        const item = body.item as CartItem;
        if (!item || !item.listingId) {
          return NextResponse.json({ error: 'Invalid item' }, { status: 400 });
        }
        const existing = cart.items.find(i => i.listingId === item.listingId);
        if (existing) {
          existing.quantity = Math.min((existing.quantity || 1) + (item.quantity || 1), 999);
        } else {
          if (cart.items.length >= MAX_ITEMS) {
            return NextResponse.json({ error: 'Cart item limit reached' }, { status: 400 });
          }
          cart.items.push({ ...item, quantity: item.quantity || 1 });
        }
        await writeCart(cart);
        return NextResponse.json(cart);
      }
      case 'update': {
        const listingId = body.listingId;
        const qty = body.quantity ?? body.item?.quantity;
        if (!listingId || typeof qty !== 'number') {
          return NextResponse.json({ error: 'Invalid update parameters' }, { status: 400 });
        }
        cart.items = cart.items.map(i => i.listingId === listingId ? { ...i, quantity: Math.max(1, Math.min(qty, 999)) } : i);
        await writeCart(cart);
        return NextResponse.json(cart);
      }
      case 'remove': {
        const listingId = body.listingId ?? body.item?.listingId;
        if (!listingId) {
          return NextResponse.json({ error: 'Invalid remove parameters' }, { status: 400 });
        }
        cart.items = cart.items.filter(i => i.listingId !== listingId);
        await writeCart(cart);
        return NextResponse.json(cart);
      }
      case 'clear': {
        cart.items = [];
        await writeCart(cart);
        return NextResponse.json(cart);
      }
      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Cart update error:', error);
    return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
  }
}