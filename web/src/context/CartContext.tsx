import React, { createContext, useContext, useState, useEffect } from 'react';

interface CartItem {
  id: number;
  name: string;
  slug: string;
  price: string;
  image: string;
  quantity: number;
  color?: { id: number, name: string };
  size?: { id: number, name: string, code: string };
  cartKey: string;
  stock?: number;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (product: any, quantity: number, color?: any, size?: any) => void;
  removeFromCart: (cartKey: string) => void;
  updateQuantity: (cartKey: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (product: any, quantity: number = 1, color?: any, size?: any) => {
    setCart(prev => {
      const cartKey = `${product.slug}-${color?.id || 'none'}-${size?.id || 'none'}`;
      const existing = prev.find(item => item.cartKey === cartKey);
      const stockLimit = product.stock !== undefined ? product.stock : 999999;
      
      if (existing) {
        return prev.map(item => 
          item.cartKey === cartKey ? { ...item, quantity: Math.min(item.quantity + quantity, stockLimit) } : item
        );
      }
      
      const rawPrice = product.sale_price || product.regular_price || "0";
      const cleanPrice = rawPrice.toString().replace(/[^0-9.]/g, '');

      return [...prev, {
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: cleanPrice,
        image: product.image,
        quantity: Math.min(quantity, stockLimit),
        color,
        size,
        cartKey,
        stock: product.stock
      }];
    });
  };

  const removeFromCart = (cartKey: string) => {
    setCart(prev => prev.filter(item => item.cartKey !== cartKey));
  };

  const updateQuantity = (cartKey: string, quantity: number) => {
    setCart(prev => prev.map(item => {
      if (item.cartKey === cartKey) {
        const stockLimit = item.stock !== undefined ? item.stock : 999999;
        return { ...item, quantity: Math.max(1, Math.min(quantity, stockLimit)) };
      }
      return item;
    }));
  };

  const clearCart = () => setCart([]);

  const parsePrice = (price: string | number): number => {
    if (price === null || price === undefined) return 0;
    const cleaned = price.toString().replace(/[^0-9.]/g, '');
    return parseFloat(cleaned) || 0;
  };

  const [isCartOpen, setIsCartOpen] = useState(false);
  const cartTotal = cart.reduce((acc, item) => {
    const p = parsePrice(item.price);
    const q = parseInt(item.quantity?.toString() || "1") || 1;
    return acc + p * q;
  }, 0);
  const cartCount = cart.reduce((acc, item) => acc + (parseInt(item.quantity?.toString() || "1") || 1), 0);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart, cartTotal, cartCount, isCartOpen, setIsCartOpen }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};
