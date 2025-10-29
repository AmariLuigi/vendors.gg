import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

export interface Favorite {
  id: string;
  createdAt: string;
  listing: {
    id: string;
    title: string;
    description: string;
    price: string;
    currency: string;
    images: any;
    status: string;
    createdAt: string;
    game: {
      id: string;
      name: string;
      slug: string;
      icon: string;
    };
    category: {
      id: string;
      name: string;
      slug: string;
    };
    seller: {
      id: string;
      firstName: string;
      lastName: string;
      rating: string;
      avatar: string;
    };
  };
}

export function useFavorites() {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's favorites
  const fetchFavorites = async () => {
    if (!session) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/favorites');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch favorites');
      }
      
      setFavorites(data.favorites || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Add a listing to favorites
  const addToFavorites = async (listingId: string) => {
    if (!session) {
      setError('You must be logged in to add favorites');
      return false;
    }
    
    try {
      const response = await fetch('/api/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ listingId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to add to favorites');
      }
      
      // Refresh favorites list
      await fetchFavorites();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  };

  // Remove a listing from favorites
  const removeFromFavorites = async (listingId: string) => {
    if (!session) {
      setError('You must be logged in to remove favorites');
      return false;
    }
    
    try {
      const response = await fetch(`/api/favorites/${listingId}`, {
        method: 'POST', // Using POST as alternative DELETE by listing ID
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove from favorites');
      }
      
      // Update local state immediately
      setFavorites(prev => prev.filter(fav => fav.listing.id !== listingId));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    }
  };

  // Check if a listing is favorited
  const isFavorited = (listingId: string) => {
    return favorites.some(fav => fav.listing.id === listingId);
  };

  // Get favorites count
  const favoritesCount = favorites.length;

  // Get recent favorites (last 5)
  const recentFavorites = favorites.slice(0, 5);

  // Load favorites when session changes
  useEffect(() => {
    if (session) {
      fetchFavorites();
    } else {
      setFavorites([]);
    }
  }, [session]);

  return {
    favorites,
    recentFavorites,
    favoritesCount,
    loading,
    error,
    addToFavorites,
    removeFromFavorites,
    isFavorited,
    fetchFavorites,
  };
}