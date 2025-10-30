'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  Download,
  MessageCircle,
  Star,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  RefreshCw
} from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

// Mock orders data
const mockOrders = [
  {
    id: 'ORD-001',
    title: 'Legendary Sword of Fire',
    game: 'World of Warcraft',
    seller: 'ProGamer123',
    sellerRating: 4.8,
    amount: 299.99,
    status: 'delivered',
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=100&h=100&fit=crop&crop=center',
    orderDate: '2024-01-15',
    deliveryDate: '2024-01-16',
    deliveryMethod: 'In-game trade',
    quantity: 1,
    hasChat: true,
    canReview: true
  },
  {
    id: 'ORD-002',
    title: 'Diamond Rank Account',
    game: 'League of Legends',
    seller: 'RankMaster',
    sellerRating: 4.9,
    amount: 450.00,
    status: 'in_transit',
    image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=100&h=100&fit=crop&crop=center',
    orderDate: '2024-01-18',
    deliveryDate: null,
    deliveryMethod: 'Account transfer',
    quantity: 1,
    hasChat: true,
    canReview: false
  },
  {
    id: 'ORD-003',
    title: 'Rare Pokemon Collection',
    game: 'Pokemon GO',
    seller: 'PokeMaster',
    sellerRating: 4.7,
    amount: 125.50,
    status: 'processing',
    image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=100&h=100&fit=crop&crop=center',
    orderDate: '2024-01-20',
    deliveryDate: null,
    deliveryMethod: 'Trade',
    quantity: 15,
    hasChat: true,
    canReview: false
  },
  {
    id: 'ORD-004',
    title: 'CS:GO Knife Skin',
    game: 'Counter-Strike 2',
    seller: 'SkinTrader',
    sellerRating: 4.6,
    amount: 750.00,
    status: 'cancelled',
    image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=100&h=100&fit=crop&crop=center',
    orderDate: '2024-01-12',
    deliveryDate: null,
    deliveryMethod: 'Steam trade',
    quantity: 1,
    hasChat: false,
    canReview: false
  },
  {
    id: 'ORD-005',
    title: 'Fortnite V-Bucks',
    game: 'Fortnite',
    seller: 'VBuckStore',
    sellerRating: 4.5,
    amount: 99.99,
    status: 'refunded',
    image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=100&h=100&fit=crop&crop=center',
    orderDate: '2024-01-10',
    deliveryDate: null,
    deliveryMethod: 'Gift card',
    quantity: 1,
    hasChat: false,
    canReview: false
  }
];

export default function BuyerOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [gameFilter, setGameFilter] = useState('all');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in_transit':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'refunded':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'in_transit':
        return <Package className="h-4 w-4" />;
      case 'processing':
        return <Clock className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      case 'refunded':
        return <RefreshCw className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const filteredOrders = mockOrders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.game.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.seller.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesGame = gameFilter === 'all' || order.game === gameFilter;
    
    return matchesSearch && matchesStatus && matchesGame;
  });

  const getOrdersByStatus = (status: string) => {
    if (status === 'all') return filteredOrders;
    return filteredOrders.filter(order => order.status === status);
  };

  const uniqueGames = [...new Set(mockOrders.map(order => order.game))];

  const OrderCard = ({ order }: { order: typeof mockOrders[0] }) => (
    <Card className="mb-4">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center space-y-4 lg:space-y-0 lg:space-x-6">
          {/* Order Image and Basic Info */}
          <div className="flex items-center space-x-4">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden">
              <Image
                src={order.image}
                alt={order.title}
                fill
                className="object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-lg truncate">{order.title}</h3>
              <p className="text-sm text-muted-foreground">{order.game}</p>
              <p className="text-sm text-muted-foreground">
                by {order.seller} 
                <span className="ml-2 inline-flex items-center">
                  <Star className="h-3 w-3 text-yellow-400 mr-1" />
                  {order.sellerRating}
                </span>
              </p>
            </div>
          </div>

          {/* Order Details */}
          <div className="flex-1 grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Order ID</p>
              <p className="font-medium">{order.id}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Amount</p>
              <p className="font-bold text-lg">${order.amount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Order Date</p>
              <p className="font-medium">{new Date(order.orderDate).toLocaleDateString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Delivery Method</p>
              <p className="font-medium">{order.deliveryMethod}</p>
            </div>
          </div>

          {/* Status and Actions */}
          <div className="flex flex-col items-end space-y-3">
            <Badge className={`${getStatusColor(order.status)} border`}>
              {getStatusIcon(order.status)}
              <span className="ml-2 capitalize">{order.status.replace('_', ' ')}</span>
            </Badge>
            
            <div className="flex space-x-2">
              <Button size="sm" variant="outline">
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
              
              {order.hasChat && (
                <Button size="sm" variant="outline">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Chat
                </Button>
              )}
              
              {order.canReview && (
                <Button size="sm">
                  <Star className="h-4 w-4 mr-1" />
                  Review
                </Button>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex flex-col space-y-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <h2 className="text-3xl font-bold tracking-tight">My Orders</h2>
        <p className="text-muted-foreground">
          Track and manage all your purchases
        </p>
      </motion.div>

      {/* Filters and Search */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search orders, games, or sellers..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="in_transit">In Transit</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>

            <Select value={gameFilter} onValueChange={setGameFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Filter by game" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Games</SelectItem>
                {uniqueGames.map(game => (
                  <SelectItem key={game} value={game}>{game}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Orders Tabs */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">
            All ({filteredOrders.length})
          </TabsTrigger>
          <TabsTrigger value="processing">
            Processing ({getOrdersByStatus('processing').length})
          </TabsTrigger>
          <TabsTrigger value="in_transit">
            In Transit ({getOrdersByStatus('in_transit').length})
          </TabsTrigger>
          <TabsTrigger value="delivered">
            Delivered ({getOrdersByStatus('delivered').length})
          </TabsTrigger>
          <TabsTrigger value="cancelled">
            Cancelled ({getOrdersByStatus('cancelled').length})
          </TabsTrigger>
          <TabsTrigger value="refunded">
            Refunded ({getOrdersByStatus('refunded').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {filteredOrders.length > 0 ? (
            filteredOrders.map(order => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No orders found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filter criteria
                </p>
                <Button>Browse Items</Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {['processing', 'in_transit', 'delivered', 'cancelled', 'refunded'].map(status => (
          <TabsContent key={status} value={status} className="space-y-4">
            {getOrdersByStatus(status).length > 0 ? (
              getOrdersByStatus(status).map(order => (
                <OrderCard key={order.id} order={order} />
              ))
            ) : (
              <Card>
                <CardContent className="p-12 text-center">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No {status.replace('_', ' ')} orders</h3>
                  <p className="text-muted-foreground">
                    You don't have any orders with this status
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        ))}
      </Tabs>
      </motion.div>
    </div>
  );
}