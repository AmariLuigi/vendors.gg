'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  ShoppingCart,
  Heart,
  MessageCircle,
  TrendingUp,
  Package,
  Clock,
  Star,
  DollarSign,
  Eye,
  CheckCircle
} from 'lucide-react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useFavorites } from '@/hooks/useFavorites';
import { useConversations } from '@/hooks/useConversations';

// Mock data for buyer dashboard
const mockOrders = [
  {
    id: '1',
    title: 'Legendary Sword of Fire',
    game: 'World of Warcraft',
    seller: 'ProGamer123',
    amount: 299.99,
    status: 'delivered',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop&crop=center',
    orderDate: '2024-01-15'
  },
  {
    id: '2',
    title: 'Diamond Rank Account',
    game: 'League of Legends',
    seller: 'RankMaster',
    amount: 450.00,
    status: 'in_transit',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&h=100&fit=crop&crop=center',
    orderDate: '2024-01-18'
  },
  {
    id: '3',
    title: 'Rare Pokemon Collection',
    game: 'Pokemon GO',
    seller: 'PokeMaster',
    amount: 125.50,
    status: 'processing',
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=100&h=100&fit=crop&crop=center',
    orderDate: '2024-01-20'
  }
];

const mockFavorites = [
  {
    id: '1',
    title: 'CS:GO Knife Skin',
    game: 'Counter-Strike 2',
    price: 750.00,
    seller: 'SkinTrader',
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&crop=center'
  },
  {
    id: '2',
    title: 'Fortnite V-Bucks',
    game: 'Fortnite',
    price: 99.99,
    seller: 'VBuckStore',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&h=100&fit=crop&crop=center'
  }
];

export default function BuyerDashboard() {
  const { data: session } = useSession();
  const { favorites, loading: favoritesLoading } = useFavorites();
  const { activeChatsCount, unreadMessagesCount, loading: conversationsLoading } = useConversations();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-3 w-3" />;
      case 'in_transit':
        return <Package className="h-3 w-3" />;
      case 'processing':
        return <Clock className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
        <p className="text-muted-foreground">
          Here's your gaming marketplace activity and recent purchases.
        </p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Spent</span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">$1,875.49</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +8.2% from last month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Orders</span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">23</p>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +3 this month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Heart className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium text-muted-foreground">Favorites</span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">{favoritesLoading ? '...' : favorites.length}</p>
              <p className="text-xs text-red-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                {favorites.length > 0 ? `${favorites.length} saved items` : 'No favorites yet'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <MessageCircle className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-muted-foreground">Active Chats</span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">
                {conversationsLoading ? '...' : activeChatsCount}
              </p>
              <p className="text-xs text-purple-600 flex items-center mt-1">
                <MessageCircle className="h-3 w-3 mr-1" />
                {conversationsLoading ? 'Loading...' : `${unreadMessagesCount} unread messages`}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Orders and Favorites */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <ShoppingCart className="h-5 w-5" />
                <span>Recent Orders</span>
              </span>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </CardTitle>
            <CardDescription>
              Your latest purchases and their delivery status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockOrders.map((order) => (
                <div key={order.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                  <div className="relative w-12 h-12 rounded-md overflow-hidden">
                    <Image
                      src={order.image}
                      alt={order.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{order.title}</p>
                    <p className="text-sm text-muted-foreground">{order.game}</p>
                    <p className="text-sm text-muted-foreground">by {order.seller}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">${order.amount}</p>
                    <Badge className={`text-xs ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Favorites */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center space-x-2">
                <Heart className="h-5 w-5" />
                <span>Recent Favorites</span>
              </span>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </CardTitle>
            <CardDescription>
              Items you've saved for later
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {favoritesLoading ? (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">Loading favorites...</p>
                </div>
              ) : favorites.length === 0 ? (
                <div className="text-center py-4">
                  <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">No favorites yet</p>
                  <p className="text-sm text-muted-foreground">Start browsing to save items you like!</p>
                </div>
              ) : (
                favorites.slice(0, 3).map((favorite) => (
                  <div key={favorite.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                    <div className="relative w-12 h-12 rounded-md overflow-hidden">
                      <Image
                        src={favorite.listing.images?.[0] || 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&crop=center'}
                        alt={favorite.listing.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{favorite.listing.title}</p>
                      <p className="text-sm text-muted-foreground">{favorite.listing.game?.name}</p>
                      <p className="text-sm text-muted-foreground">by {favorite.listing.account?.username ?? 'Unknown'}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">${favorite.listing.price}</p>
                      <Button size="sm" className="mt-1">
                        Buy Now
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Eye className="h-6 w-6" />
              <span>Browse Items</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Heart className="h-6 w-6" />
              <span>My Favorites</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <MessageCircle className="h-6 w-6" />
              <span>Messages</span>
            </Button>
            <Button variant="outline" className="h-20 flex-col space-y-2">
              <Star className="h-6 w-6" />
              <span>Leave Review</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}