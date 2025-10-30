'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search,
  Heart,
  ShoppingCart,
  MessageCircle,
  Star,
  Eye,
  Filter,
  Grid3X3,
  List,
  Trash2,
  Share2,
  Square,
  CheckSquare
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useFavorites } from '@/hooks/useFavorites';
import { motion } from 'framer-motion';
import { sanitizeImageArray } from '@/lib/image-utils';

export default function BuyerFavoritesPage() {
  const { data: session } = useSession();
  const { favorites, loading, removeFromFavorites } = useFavorites();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [gameFilter, setGameFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [priceFilter, setPriceFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [selectionMode, setSelectionMode] = useState(false);

  // Transform favorites data to match the expected format
  const transformedFavorites = favorites.map(fav => ({
    id: fav.id,
    listingId: fav.listing?.id || '',
    title: fav.listing?.title || 'Unknown Item',
    game: fav.listing?.game?.name || 'Unknown Game',
    price: parseFloat(fav.listing?.price || '0'),
    originalPrice: parseFloat(fav.listing?.price || '0'),
    seller: fav.listing?.seller ? `${fav.listing.seller.firstName} ${fav.listing.seller.lastName}` : 'Unknown Seller',
    sellerRating: 4.5, // Default rating since we don't have this in our schema
    image: sanitizeImageArray(fav.listing?.images, '/placeholder-game.svg')[0] || fav.listing?.game?.icon || '/placeholder-game.svg',
    condition: 'Good', // Default condition since not in schema
    rarity: 'Common', // Default rarity since not in schema
    addedDate: fav.createdAt,
    isOnSale: false, // We don't have sale info in our schema
    discount: 0,
    views: 0, // Default views since not in schema
    category: fav.listing?.category?.name || 'Unknown'
  }));

  const uniqueGames = [...new Set(transformedFavorites.map(item => item.game))];
  const uniqueCategories = [...new Set(transformedFavorites.map(item => item.category))];

  const filteredFavorites = transformedFavorites
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.game.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.seller.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGame = gameFilter === 'all' || item.game === gameFilter;
      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
      
      let matchesPrice = true;
      if (priceFilter !== 'all') {
        switch (priceFilter) {
          case 'under_10':
            matchesPrice = item.price < 10;
            break;
          case '10_50':
            matchesPrice = item.price >= 10 && item.price <= 50;
            break;
          case '50_100':
            matchesPrice = item.price >= 50 && item.price <= 100;
            break;
          case 'over_100':
            matchesPrice = item.price > 100;
            break;
        }
      }
      
      return matchesSearch && matchesGame && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime();
        case 'oldest':
          return new Date(a.addedDate).getTime() - new Date(b.addedDate).getTime();
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'popular':
          return b.views - a.views;
        default:
          return 0;
      }
    });

  const toggleItemSelection = (itemId: string) => {
    if (!selectionMode) return; // Only allow selection when in selection mode
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const toggleSelectionMode = () => {
    setSelectionMode(prev => !prev);
    if (selectionMode) {
      // Clear selections when exiting selection mode
      setSelectedItems([]);
    }
  };

  const handleRemoveFromFavorites = async (itemIds: string[]) => {
    // Show confirmation dialog
    const itemCount = itemIds.length;
    const confirmMessage = itemCount === 1 
      ? 'Are you sure you want to remove this item from your favorites?' 
      : `Are you sure you want to remove ${itemCount} items from your favorites?`;
    
    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      let successCount = 0;
      for (const itemId of itemIds) {
        const favorite = transformedFavorites.find(fav => fav.id === itemId);
        if (favorite) {
          const success = await removeFromFavorites(favorite.listingId);
          if (success) {
            successCount++;
          }
        }
      }
      
      setSelectedItems([]);
      
      // Only show success message if items were actually removed
      if (successCount > 0) {
        const successMessage = successCount === 1 
          ? 'Item removed from favorites successfully!' 
          : `${successCount} items removed from favorites successfully!`;
        alert(successMessage);
      }
      
      // Show partial success or failure message
      if (successCount < itemCount) {
        const failedCount = itemCount - successCount;
        const failureMessage = failedCount === itemCount 
          ? 'Failed to remove items from favorites. Please try again.'
          : `${failedCount} items could not be removed. Please try again.`;
        alert(failureMessage);
      }
    } catch (error) {
      console.error('Error removing favorites:', error);
      alert('Failed to remove favorites. Please try again.');
    }
  };

  const FavoriteCard = ({ item }: { item: typeof transformedFavorites[0] }) => {
    const isSelected = selectedItems.includes(item.id);
    
    return (
      <Card 
        className={`group hover:shadow-lg transition-all duration-200 cursor-pointer ${
          viewMode === 'list' ? 'mb-4' : ''
        } ${
          selectionMode && isSelected 
            ? 'ring-2 ring-blue-600 border-blue-600 shadow-lg' 
            : selectionMode 
              ? 'hover:ring-2 hover:ring-blue-300' 
              : ''
        }`}
        onClick={(e) => {
          if (selectionMode) {
            e.preventDefault();
            toggleItemSelection(item.id);
          }
        }}
      >
        <Link href={`/listings/${item.listingId}`} className={selectionMode ? 'pointer-events-none' : ''}>
          <div className={`${viewMode === 'grid' ? 'flex flex-col' : 'flex flex-row'}`}>
            {/* Image */}
            <div className={`relative ${viewMode === 'grid' ? 'h-48' : 'w-48 h-32'} overflow-hidden`}>
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover group-hover:scale-105 transition-transform"
              />
              {item.isOnSale && (
                <Badge className="absolute top-2 left-2 bg-red-500 text-white">
                  -{item.discount}%
                </Badge>
              )}
              <div className="absolute top-2 right-2 flex space-x-1">
                {/* Visual heart indicator - not clickable */}
                <div className="h-8 w-8 p-0 bg-white/80 rounded-md flex items-center justify-center">
                  <Heart className="h-4 w-4 fill-red-500 text-red-500" />
                </div>
              </div>
              
              {/* Selection indicator - only show in selection mode */}
              {selectionMode && (
                <div className="absolute top-2 left-2">
                  <div className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${
                    isSelected 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-white/80 text-gray-600'
                  }`}>
                    {isSelected ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </div>
                </div>
              )}
            </div>

          {/* Content */}
          <CardContent className={`p-4 ${viewMode === 'list' ? 'flex-1' : ''}`}>
            <div className={`${viewMode === 'list' ? 'flex justify-between items-start' : 'space-y-2'}`}>
              <div className={`${viewMode === 'list' ? 'flex-1 pr-4' : ''}`}>
                <h3 className="font-semibold text-lg line-clamp-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.game}</p>
                <p className="text-sm text-muted-foreground">
                  by {item.seller}
                  <span className="ml-2 inline-flex items-center">
                    <Star className="h-3 w-3 text-yellow-400 mr-1" />
                    {item.sellerRating}
                  </span>
                </p>
                
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="outline" className="text-xs">
                    {item.condition}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {item.rarity}
                </Badge>
              </div>
            </div>

            <div className={`${viewMode === 'list' ? 'text-right' : 'mt-4'}`}>
              <div className="flex items-center space-x-2">
                {item.isOnSale && (
                  <span className="text-sm text-muted-foreground line-through">
                    ${item.originalPrice}
                  </span>
                )}
                <span className="text-xl font-bold">${item.price}</span>
              </div>
              
              <div className={`flex ${viewMode === 'list' ? 'justify-end' : 'justify-between'} items-center mt-3 space-x-2`}>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Eye className="h-3 w-3 mr-1" />
                  {item.views}
                </div>
                
                <div className="flex space-x-1">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleRemoveFromFavorites([item.id]);
                    }}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline">
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                  <Button size="sm">
                    <ShoppingCart className="h-4 w-4 mr-1" />
                    Buy
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
        </div>
      </Link>
    </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex flex-col space-y-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">My Favorites</h2>
            <p className="text-muted-foreground">
              Items you've saved for later ({filteredFavorites.length} items)
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={selectionMode ? "default" : "outline"}
              onClick={toggleSelectionMode}
              className={selectionMode ? "bg-blue-600 hover:bg-blue-700" : ""}
            >
              {selectionMode ? "Exit Selection" : "Select Items"}
            </Button>
            {selectionMode && selectedItems.length > 0 && (
              <Button
                variant="destructive"
                onClick={() => handleRemoveFromFavorites(selectedItems)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete ({selectedItems.length})
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Filters and Controls */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-7 gap-4 items-center">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search favorites..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            {/* Game Filter */}
            <Select value={gameFilter} onValueChange={setGameFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Games" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Games</SelectItem>
                {uniqueGames.map(game => (
                  <SelectItem key={game} value={game}>{game}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Category Filter */}
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Filter */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Newest First" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="oldest">Oldest First</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>

            {/* Price Filter */}
            <Select value={priceFilter} onValueChange={setPriceFilter}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="All Prices" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Prices</SelectItem>
                <SelectItem value="under_10">Under $10</SelectItem>
                <SelectItem value="10_50">$10 - $50</SelectItem>
                <SelectItem value="50_100">$50 - $100</SelectItem>
                <SelectItem value="over_100">Over $100</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex border rounded-md w-fit justify-self-center">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="flex items-center justify-between mt-4 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">
                {selectedItems.length} item(s) selected
              </span>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemoveFromFavorites(selectedItems)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Remove
                </Button>
                <Button size="sm" variant="outline">
                  <Share2 className="h-4 w-4 mr-1" />
                  Share
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      </motion.div>

      {/* Favorites Grid/List */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
      {loading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <h3 className="text-lg font-semibold mb-2">Loading your favorites...</h3>
            <p className="text-muted-foreground">Please wait while we fetch your saved items.</p>
          </CardContent>
        </Card>
      ) : filteredFavorites.length > 0 ? (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' : 'space-y-0'}>
          {filteredFavorites.map(item => (
            <FavoriteCard key={item.id} item={item} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No favorites found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || gameFilter !== 'all' || categoryFilter !== 'all'
                ? 'Try adjusting your search or filter criteria'
                : 'Start browsing items and add them to your favorites'
              }
            </p>
            <Button asChild>
              <Link href="/games">Browse Items</Link>
            </Button>
          </CardContent>
        </Card>
      )}
      </motion.div>
    </div>
  );
}