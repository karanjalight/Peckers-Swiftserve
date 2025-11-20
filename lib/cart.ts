// lib/cart.ts
export interface CartItem {
  id: string | number;
  name: string;
  price: number;
  image_url?: string; // Made optional to save space
  quantity: number;
}

const CART_KEY = "cart_items";
const MAX_CART_ITEMS = 100; // Prevent unlimited growth

function dispatchCartUpdate() {
  if (typeof window !== "undefined") {
    // Dispatch with a small delay to ensure DOM is ready
    setTimeout(() => {
      window.dispatchEvent(new Event("cartUpdated"));
      console.log("Cart updated event dispatched"); // Debug log
    }, 0);
  }
}

// ✅ Get all items
export function getCart(): CartItem[] {
  if (typeof window === "undefined") return [];
  
  try {
    // Try sessionStorage first (better for carts, clears on browser close)
    const stored = sessionStorage.getItem(CART_KEY);
    if (stored) return JSON.parse(stored);
    
    // Fallback to localStorage
    const localStored = localStorage.getItem(CART_KEY);
    if (localStored) {
      const cart = JSON.parse(localStored);
      // Migrate to sessionStorage
      sessionStorage.setItem(CART_KEY, localStored);
      localStorage.removeItem(CART_KEY);
      return cart;
    }
  } catch (error) {
    console.error("Error reading cart:", error);
  }
  
  return [];
}

// ✅ Save all items with robust error handling
function saveCart(cart: CartItem[]) {
  if (typeof window === "undefined") return;
  
  // Limit cart size
  if (cart.length > MAX_CART_ITEMS) {
    cart = cart.slice(0, MAX_CART_ITEMS);
    console.warn(`Cart limited to ${MAX_CART_ITEMS} items`);
  }
  
  // Optimize data before saving (remove unnecessary fields)
  const optimizedCart = cart.map(item => ({
    id: item.id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    // Only store image_url if it's short (not base64 data)
    ...(item.image_url && item.image_url.length < 200 ? { image_url: item.image_url } : {})
  }));
  
  const cartData = JSON.stringify(optimizedCart);
  
  try {
    // Try sessionStorage first
    sessionStorage.setItem(CART_KEY, cartData);
    dispatchCartUpdate();
  } catch (e) {
    if (e instanceof DOMException && e.name === 'QuotaExceededError') {
      console.warn('Storage quota exceeded, attempting recovery...');
      
      try {
        // Clear sessionStorage except cart
        const temp = sessionStorage.getItem(CART_KEY);
        sessionStorage.clear();
        if (temp) sessionStorage.setItem(CART_KEY, temp);
        
        // Retry with minimal data
        const minimalCart = optimizedCart.map(item => ({
          id: item.id,
          name: item.name.substring(0, 50), // Truncate long names
          price: item.price,
          quantity: item.quantity
        }));
        
        sessionStorage.setItem(CART_KEY, JSON.stringify(minimalCart));
        dispatchCartUpdate();
        
        // Notify user
        console.warn('Cart saved with reduced data due to storage limits');
      } catch (retryError) {
        console.error('Failed to save cart even after cleanup:', retryError);
        // Last resort: use in-memory storage
        (window as any).__cartBackup = optimizedCart;
        dispatchCartUpdate();
      }
    } else {
      console.error('Error saving cart:', e);
    }
  }
}

// ✅ Add or update an item
export function addToCart(item: CartItem) {
  const cart = getCart();
  
  // Check if cart is at limit
  if (cart.length >= MAX_CART_ITEMS && !cart.find((p) => p.id === item.id)) {
    throw new Error(`Cart is full (max ${MAX_CART_ITEMS} items). Please remove items before adding more.`);
  }
  
  const existing = cart.find((p) => p.id === item.id);
  
  if (existing) {
    existing.quantity += item.quantity;
  } else {
    cart.push(item);
  }
  
  saveCart(cart);
  return cart;
}

// ✅ Update item quantity
export function updateCartQuantity(id: string | number, quantity: number) {
  const cart = getCart();
  const item = cart.find((p) => p.id === id);
  
  if (item) {
    item.quantity = Math.max(1, quantity);
    saveCart(cart);
  }
  
  return cart;
}

// ✅ Remove item
export function removeFromCart(id: string | number) {
  const cart = getCart().filter((p) => p.id !== id);
  saveCart(cart);
  return cart;
}

// ✅ Clear cart
export function clearCart() {
  if (typeof window === "undefined") return;
  
  sessionStorage.removeItem(CART_KEY);
  localStorage.removeItem(CART_KEY);
  delete (window as any).__cartBackup;
  dispatchCartUpdate();
}

// ✅ Get cart total
export function getCartTotal(): number {
  const cart = getCart();
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

// ✅ Get cart item count
export function getCartItemCount(): number {
  const cart = getCart();
  return cart.reduce((count, item) => count + item.quantity, 0);
}

// ✅ Check storage health (for debugging)
export function checkStorageHealth(): {
  available: boolean;
  cartSize: number;
  cartItems: number;
  storageUsed: number;
} {
  if (typeof window === "undefined") {
    return { available: false, cartSize: 0, cartItems: 0, storageUsed: 0 };
  }
  
  try {
    const cart = getCart();
    const cartData = JSON.stringify(cart);
    const cartSize = new Blob([cartData]).size;
    
    // Estimate total storage used
    let totalSize = 0;
    for (let key in sessionStorage) {
      if (sessionStorage.hasOwnProperty(key)) {
        totalSize += new Blob([sessionStorage.getItem(key) || '']).size;
      }
    }
    
    return {
      available: true,
      cartSize: cartSize,
      cartItems: cart.length,
      storageUsed: totalSize
    };
  } catch (error) {
    return { available: false, cartSize: 0, cartItems: 0, storageUsed: 0 };
  }
}