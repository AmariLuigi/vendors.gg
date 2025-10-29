'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Search, Filter, Star, Clock, MapPin } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: string;
  currency: string;
  images: string[];
  rarity: string;
  condition: string;
  quantity: number;
  game: {
    name: string;
    image: string;
  };
  category: {
    name: string;
  };
  subcategory: {
    name: string;
  };
  seller: {
    firstName: string;
    lastName: string;
    rating: number;
    totalReviews: number;
  };
  deliveryTime: string;
  regions: string[];
  createdAt: string;
  views: number;
  favorites: number;
}

interface BrowseGamesClientProps {
  listingsData: Listing[];
}

export function BrowseGamesClient({ listingsData }: BrowseGamesClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGame, setSelectedGame] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRarity, setSelectedRarity] = useState('all');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Extract unique values for filters
  const uniqueGames = useMemo(() => {
    const games = listingsData.map(listing => listing.game?.name).filter(Boolean);
    return [...new Set(games)];
  }, [listingsData]);

  const uniqueCategories = useMemo(() => {
    const categories = listingsData.map(listing => listing.category?.name).filter(Boolean);
    return [...new Set(categories)];
  }, [listingsData]);

  const uniqueRarities = useMemo(() => {
    const rarities = listingsData.map(listing => listing.rarity).filter(Boolean);
    return [...new Set(rarities)];
  }, [listingsData]);

  // Filter and sort listings
  const filteredListings = useMemo(() => {
    let filtered = listingsData.filter(listing => {
      const matchesSearch = listing.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          listing.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesGame = selectedGame === 'all' || listing.game?.name === selectedGame;
      const matchesCategory = selectedCategory === 'all' || listing.category?.name === selectedCategory;
      const matchesRarity = selectedRarity === 'all' || listing.rarity === selectedRarity;
      
      let matchesPrice = true;
      if (priceRange !== 'all') {
        const price = parseFloat(listing.price);
        switch (priceRange) {
          case 'under-10':
            matchesPrice = price < 10;
            break;
          case '10-50':
            matchesPrice = price >= 10 && price <= 50;
            break;
          case '50-100':
            matchesPrice = price >= 50 && price <= 100;
            break;
          case 'over-100':
            matchesPrice = price > 100;
            break;
        }
      }

      return matchesSearch && matchesGame && matchesCategory && matchesRarity && matchesPrice;
    });

    // Sort listings
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return parseFloat(a.price) - parseFloat(b.price);
        case 'price-high':
          return parseFloat(b.price) - parseFloat(a.price);
        case 'rating':
          return (b.seller?.rating || 0) - (a.seller?.rating || 0);
        case 'popular':
          return (b.views || 0) - (a.views || 0);
        case 'newest':
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return filtered;
  }, [listingsData, searchTerm, selectedGame, selectedCategory, selectedRarity, priceRange, sortBy]);

  const formatPrice = (price: string, currency: string) => {
    const numPrice = parseFloat(price);
    return `${currency === 'USD' ? '$' : currency} ${numPrice.toFixed(2)}`;
  };

  const formatRating = (rating: number) => {
    return rating ? rating.toFixed(1) : 'N/A';
  };

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-card rounded-lg p-6 border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search listings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={selectedGame} onValueChange={setSelectedGame}>
            <SelectTrigger>
              <SelectValue placeholder="All Games" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Games</SelectItem>
              {uniqueGames.map(game => (
                <SelectItem key={game} value={game}>{game}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category}>{category}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedRarity} onValueChange={setSelectedRarity}>
            <SelectTrigger>
              <SelectValue placeholder="All Rarities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rarities</SelectItem>
              {uniqueRarities.map(rarity => (
                <SelectItem key={rarity} value={rarity}>{rarity}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger>
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="price-low">Price: Low to High</SelectItem>
              <SelectItem value="price-high">Price: High to Low</SelectItem>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="popular">Most Popular</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4">
          <Select value={priceRange} onValueChange={setPriceRange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Price Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="under-10">Under $10</SelectItem>
              <SelectItem value="10-50">$10 - $50</SelectItem>
              <SelectItem value="50-100">$50 - $100</SelectItem>
              <SelectItem value="over-100">Over $100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground">
          Showing {filteredListings.length} of {listingsData.length} listings
        </p>
      </div>

      {/* Listings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredListings.map((listing) => (
          <Card key={listing.id} className="group hover:shadow-lg transition-shadow duration-200">
            <CardHeader className="p-0">
              <div className="relative aspect-video overflow-hidden rounded-t-lg">
                <Image
                  src={listing.images?.[0] || listing.game?.image || '/placeholder-game.jpg'}
                  alt={listing.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
                <div className="absolute top-2 right-2">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-black/20 hover:bg-black/40">
                    <Heart className="h-4 w-4 text-white" />
                  </Button>
                </div>
                {listing.rarity && (
                  <Badge className="absolute top-2 left-2" variant="secondary">
                    {listing.rarity}
                  </Badge>
                )}
              </div>
            </CardHeader>
            
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{listing.game?.name}</span>
                  <span>•</span>
                  <span>{listing.category?.name}</span>
                </div>
                
                <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">
                  {listing.title}
                </h3>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {listing.description}
                </p>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm">{formatRating(listing.seller?.rating || 0)}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({listing.seller?.totalReviews || 0} reviews)
                  </span>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{listing.deliveryTime}</span>
                  </div>
                  {listing.regions?.[0] && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{listing.regions[0]}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="p-4 pt-0">
              <div className="flex items-center justify-between w-full">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-primary">
                    {formatPrice(listing.price, listing.currency)}
                  </div>
                  {listing.quantity > 1 && (
                    <div className="text-sm text-muted-foreground">
                      Qty: {listing.quantity}
                    </div>
                  )}
                </div>
                <Button size="sm" asChild>
                  <Link href={`/listings/${listing.id}`}>
                    View Details
                  </Link>
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredListings.length === 0 && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No listings found</h3>
            <p>Try adjusting your search criteria or filters</p>
          </div>
          <Button 
            variant="outline" 
            onClick={() => {
              setSearchTerm('');
              setSelectedGame('all');
              setSelectedCategory('all');
              setSelectedRarity('all');
              setPriceRange('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}