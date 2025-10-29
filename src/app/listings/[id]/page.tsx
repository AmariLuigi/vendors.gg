'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Star, Heart, Eye, Clock, Shield, MessageCircle, Share2, Flag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { StartConversationButton } from '@/components/chat/StartConversationButton';
import { listingsAPI } from '@/lib/api';
import { useSession } from 'next-auth/react';
import { useFavorites } from '@/hooks/useFavorites';

interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  images: string[];
  rarity: string;
  condition: string;
  quantity: number;
  deliveryTime: string;
  regions: string[];
  tags: string[];
  views: number;
  favorites: number;
  createdAt: string;
  updatedAt: string;
  seller: {
    id: string;
    firstName: string;
    lastName: string;
    rating: number;
    totalReviews: number;
    avatar?: string;
    joinedAt: string;
  };
  game: {
    id: string;
    name: string;
    icon?: string;
  };
  category: {
    id: string;
    name: string;
  };
  subcategory: {
    id: string;
    name: string;
  };
  server?: {
    id: string;
    name: string;
    region: string;
  };
  league?: {
    id: string;
    name: string;
  };
}

export default function ListingDetailPage() {
  const params = useParams();
  const listingId = params.id as string;
  const { data: session } = useSession();
  const { favorites, addToFavorites, removeFromFavorites, loading: favoritesLoading } = useFavorites();
  
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Check if current listing is favorited
  const isFavorited = favorites.some(fav => fav.listing.id === listingId);

  useEffect(() => {
    const fetchListing = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch actual listing data from API
        const response = await fetch(`/api/listings/${listingId}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch listing');
        }
        
        const result = await response.json();
        
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch listing');
        }
        
        // Transform the API response to match our interface
        const apiListing = result.data;
        const transformedListing: Listing = {
          id: apiListing.id,
          title: apiListing.title,
          description: apiListing.description,
          price: parseFloat(apiListing.price),
          currency: apiListing.currency,
          images: apiListing.images || ['https://via.placeholder.com/800x600?text=No+Image'],
          rarity: apiListing.rarity,
          condition: apiListing.condition,
          quantity: apiListing.quantity,
          deliveryTime: apiListing.deliveryTime,
          regions: apiListing.regions || [],
          tags: [], // Tags not in current schema, can be added later
          views: apiListing.views || 0,
          favorites: apiListing.favorites || 0,
          createdAt: apiListing.createdAt,
          updatedAt: apiListing.updatedAt,
          seller: {
            id: apiListing.seller.id,
            firstName: apiListing.seller.firstName,
            lastName: apiListing.seller.lastName,
            rating: apiListing.seller.rating || 0,
            totalReviews: apiListing.seller.totalReviews || 0,
            avatar: apiListing.seller.avatar,
            joinedAt: apiListing.seller.createdAt || new Date().toISOString()
          },
          game: {
            id: apiListing.game.id,
            name: apiListing.game.name,
            icon: apiListing.game.icon
          },
          category: {
            id: apiListing.category.id,
            name: apiListing.category.name
          },
          subcategory: {
            id: apiListing.subcategory?.id || '',
            name: apiListing.subcategory?.name || ''
          },
          server: apiListing.server ? {
            id: apiListing.server.id,
            name: apiListing.server.name,
            region: apiListing.server.region
          } : undefined,
          league: apiListing.league ? {
            id: apiListing.league.id,
            name: apiListing.league.name
          } : undefined
        };
        
        setListing(transformedListing);
      } catch (err) {
        setError('Failed to load listing details');
        console.error('Error fetching listing:', err);
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  const handleFavoriteToggle = async () => {
    if (!session) {
      alert('Please sign in to add favorites');
      return;
    }

    try {
      if (isFavorited) {
        await removeFromFavorites(listingId);
      } else {
        await addToFavorites(listingId);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      alert('Failed to update favorite. Please try again.');
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: listing?.title,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="aspect-video bg-gray-200 rounded-lg"></div>
              <div className="flex space-x-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-20 h-20 bg-gray-200 rounded-lg"></div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !listing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Listing Not Found</h1>
          <p className="text-muted-foreground mb-4">
            {error || 'The listing you are looking for does not exist.'}
          </p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
        <span>Games</span>
        <span>/</span>
        <span>{listing.game.name}</span>
        <span>/</span>
        <span>{listing.category.name}</span>
        <span>/</span>
        <span className="text-foreground">{listing.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Images Section */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-video relative overflow-hidden rounded-lg border">
              <Image
                src={listing.images[selectedImageIndex]}
                alt={listing.title}
                fill
                className="object-cover"
              />
            </div>
            
            {/* Thumbnail Images */}
            {listing.images.length > 1 && (
              <div className="flex space-x-2 overflow-x-auto">
                {listing.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`flex-shrink-0 w-20 h-20 relative overflow-hidden rounded-lg border-2 transition-colors ${
                      selectedImageIndex === index ? 'border-primary' : 'border-gray-200'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${listing.title} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground leading-relaxed">
                {listing.description}
              </p>
            </CardContent>
          </Card>

          {/* Item Details */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Item Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Game</span>
                  <p className="font-medium">{listing.game.name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Category</span>
                  <p className="font-medium">{listing.category.name}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Rarity</span>
                  <p className="font-medium">{listing.rarity}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Condition</span>
                  <p className="font-medium">{listing.condition}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Quantity</span>
                  <p className="font-medium">{listing.quantity}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Delivery Time</span>
                  <p className="font-medium">{listing.deliveryTime}</p>
                </div>
              </div>
              
              {listing.server && (
                <div>
                  <span className="text-sm text-muted-foreground">Server</span>
                  <p className="font-medium">{listing.server.name} ({listing.server.region})</p>
                </div>
              )}
              
              {listing.regions.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Available Regions</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {listing.regions.map((region) => (
                      <Badge key={region} variant="secondary">
                        {region}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              
              {listing.tags.length > 0 && (
                <div>
                  <span className="text-sm text-muted-foreground">Tags</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {listing.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Purchase Section */}
        <div className="space-y-6">
          {/* Price and Actions */}
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <div className="text-3xl font-bold">
                    ${listing.price.toFixed(2)} {listing.currency}
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-2">
                    <div className="flex items-center space-x-1">
                      <Eye className="w-4 h-4" />
                      <span>{listing.views} views</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Heart className="w-4 h-4" />
                      <span>{listing.favorites} favorites</span>
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <Button className="w-full" size="lg">
                    Buy Now
                  </Button>
                  
                  <StartConversationButton
                    listingId={listing.id}
                    sellerId={listing.seller.id}
                    listingTitle={listing.title}
                    className="w-full"
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleFavoriteToggle}
                    className="flex-1"
                  >
                    <Heart className={`w-4 h-4 mr-2 ${isFavorited ? 'fill-current text-red-500' : ''}`} />
                    {isFavorited ? 'Favorited' : 'Favorite'}
                  </Button>
                  
                  <Button variant="outline" size="sm" onClick={handleShare}>
                    <Share2 className="w-4 h-4" />
                  </Button>
                  
                  <Button variant="outline" size="sm">
                    <Flag className="w-4 h-4" />
                  </Button>
                </div>

                <div className="flex items-center space-x-2 text-sm text-green-600">
                  <Shield className="w-4 h-4" />
                  <span>Protected by Buyer Protection</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Seller Info */}
          <Card>
            <CardHeader>
              <CardTitle>Seller Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={listing.seller.avatar} />
                  <AvatarFallback>
                    {listing.seller.firstName[0]}{listing.seller.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="font-medium">
                    {listing.seller.firstName} {listing.seller.lastName}
                  </h4>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 fill-current text-yellow-400" />
                    <span className="text-sm">
                      {listing.seller.rating} ({listing.seller.totalReviews} reviews)
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>
                    Member since {new Date(listing.seller.joinedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <Button variant="outline" className="w-full">
                View Seller Profile
              </Button>
            </CardContent>
          </Card>

          {/* Delivery Info */}
          <Card>
            <CardHeader>
              <CardTitle>Delivery Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Delivery Time</span>
                <span className="text-sm font-medium">{listing.deliveryTime}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Delivery Method</span>
                <span className="text-sm font-medium">In-game Trade</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Availability</span>
                <Badge variant="secondary" className="text-green-600">
                  Online Now
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}