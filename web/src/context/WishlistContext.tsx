import React, { createContext, useContext, useState, useEffect } from 'react';
import { getWishlist, addToWishlist as addToWishlistApi, removeFromWishlist as removeFromWishlistApi } from '../services/api';
import { useAuth } from './AuthContext';

interface WishlistContextType {
  wishlist: any[];
  addToWishlist: (productId: number) => Promise<void>;
  removeFromWishlist: (wishlistId: number) => Promise<void>;
  isInWishlist: (productId: number) => boolean;
  loading: boolean;
  refreshWishlist: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [wishlist, setWishlist] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();

  const refreshWishlist = async () => {
    if (!isAuthenticated) {
      setWishlist([]);
      return;
    }
    setLoading(true);
    try {
      const response = await getWishlist();
      setWishlist(response.data);
    } catch (error) {
      console.error('Failed to fetch wishlist:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshWishlist();
  }, [isAuthenticated]);

  const addToWishlist = async (productId: number) => {
    if (!isAuthenticated) return;
    try {
      await addToWishlistApi(productId);
      await refreshWishlist();
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
    }
  };

  const removeFromWishlist = async (wishlistId: number) => {
    try {
      await removeFromWishlistApi(wishlistId);
      setWishlist(wishlist.filter(item => item.id !== wishlistId));
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
    }
  };

  const isInWishlist = (productId: number) => {
    return wishlist.some(item => item.product.id === productId);
  };

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, isInWishlist, loading, refreshWishlist }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
