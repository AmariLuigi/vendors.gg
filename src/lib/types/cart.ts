export interface CartItem {
  listingId: string;
  title: string;
  price: number;
  currency: string;
  quantity: number;
  image?: string;
  sellerId?: string;
}

export interface CartState {
  items: CartItem[];
  updatedAt?: string;
}

export type CartActionType =
  | 'add'
  | 'update'
  | 'remove'
  | 'clear';

export interface CartUpdateRequest {
  action: CartActionType;
  item?: CartItem;
  listingId?: string;
  quantity?: number;
}