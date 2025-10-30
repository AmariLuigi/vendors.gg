'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  MoreHorizontal,
  Search,
  Filter,
  Plus,
  Edit,
  Pause,
  Trash2,
  BarChart3,
  Eye,
  Clock,
  DollarSign,
  Upload,
  Package
} from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ListingCard {
  id: string;
  thumbnail: string;
  title: string;
  game: string;
  price: number;
  views: number;
  status: 'active' | 'draft' | 'sold' | 'expired' | 'paused';
  createdAt: string;
  expiresAt?: string;
}

const mockListings: ListingCard[] = [
  {
    id: '1',
    thumbnail: '/logo.png',
    title: 'CS2 AK-47 Redline (Field-Tested)',
    game: 'Counter-Strike 2',
    price: 45.99,
    views: 234,
    status: 'active',
    createdAt: '2024-01-15',
    expiresAt: '2024-02-15'
  },
  {
    id: '2',
    thumbnail: '/logo.png',
    title: 'Valorant Account - Immortal Rank',
    game: 'Valorant',
    price: 120.00,
    views: 89,
    status: 'active',
    createdAt: '2024-01-12',
    expiresAt: '2024-02-12'
  },
  {
    id: '3',
    thumbnail: '/logo.png',
    title: 'Fortnite V-Bucks 2800 Package',
    game: 'Fortnite',
    price: 19.99,
    views: 156,
    status: 'paused',
    createdAt: '2024-01-10'
  },
  {
    id: '4',
    thumbnail: '/logo.png',
    title: 'League of Legends Account - Diamond',
    game: 'League of Legends',
    price: 85.50,
    views: 67,
    status: 'draft',
    createdAt: '2024-01-08'
  },
  {
    id: '5',
    thumbnail: '/logo.png',
    title: 'CS2 Butterfly Knife Fade',
    game: 'Counter-Strike 2',
    price: 450.00,
    views: 445,
    status: 'sold',
    createdAt: '2024-01-05'
  }
];

function getStatusBadge(status: string) {
  const variants = {
    active: { variant: 'default' as const, label: 'Active' },
    draft: { variant: 'secondary' as const, label: 'Draft' },
    sold: { variant: 'default' as const, label: 'Sold' },
    expired: { variant: 'destructive' as const, label: 'Expired' },
    paused: { variant: 'outline' as const, label: 'Paused' }
  };
  
  const config = variants[status as keyof typeof variants] || variants.draft;
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

function ListingCardComponent({ listing }: { listing: ListingCard }) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex space-x-4">
          {/* Thumbnail */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-accent rounded-lg overflow-hidden">
              <Image
                src={listing.thumbnail}
                alt={listing.title}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground truncate">
                  {listing.title}
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  {listing.game}
                </p>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-1">
                    <DollarSign className="h-3 w-3 text-green-500" />
                    <span className="text-sm font-medium text-green-600">
                      ${listing.price}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Eye className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {listing.views} views
                    </span>
                  </div>
                  {listing.expiresAt && (
                    <div className="flex items-center space-x-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        Expires {new Date(listing.expiresAt).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2 ml-4">
                {getStatusBadge(listing.status)}
                <Button variant="ghost" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2 mt-3">
              <Button size="sm" variant="outline" className="flex items-center space-x-1">
                <Edit className="h-3 w-3" />
                <span>Edit</span>
              </Button>
              {listing.status === 'active' ? (
                <Button size="sm" variant="outline" className="flex items-center space-x-1">
                  <Pause className="h-3 w-3" />
                  <span>Pause</span>
                </Button>
              ) : (
                <Button size="sm" variant="outline" className="flex items-center space-x-1">
                  <span>Resume</span>
                </Button>
              )}
              <Button size="sm" variant="outline" className="flex items-center space-x-1">
                <Upload className="h-3 w-3" />
                <span>Upload Proof</span>
              </Button>
              <Button size="sm" variant="outline" className="flex items-center space-x-1">
                <BarChart3 className="h-3 w-3" />
                <span>Analytics</span>
              </Button>
              <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function MyListings() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('active');

  const filteredListings = mockListings.filter(listing => {
    const matchesSearch = listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         listing.game.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || listing.status === activeTab;
    return matchesSearch && matchesTab;
  });

  const getTabCount = (status: string) => {
    if (status === 'all') return mockListings.length;
    return mockListings.filter(listing => listing.status === status).length;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div 
        className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Listings</h2>
          <p className="text-muted-foreground">
            Manage your gaming items and accounts
          </p>
        </div>
        <Button className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Create New Listing</span>
        </Button>
      </motion.div>

      {/* Search and Filters */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <Card>
        <CardContent className="p-4">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search listings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>Filters</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      </motion.div>

      {/* Listings Tabs */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="active" className="flex items-center space-x-2">
            <span>Active</span>
            <Badge variant="secondary" className="ml-1">
              {getTabCount('active')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="draft" className="flex items-center space-x-2">
            <span>Draft</span>
            <Badge variant="secondary" className="ml-1">
              {getTabCount('draft')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="sold" className="flex items-center space-x-2">
            <span>Sold</span>
            <Badge variant="secondary" className="ml-1">
              {getTabCount('sold')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="expired" className="flex items-center space-x-2">
            <span>Expired</span>
            <Badge variant="secondary" className="ml-1">
              {getTabCount('expired')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="paused" className="flex items-center space-x-2">
            <span>Paused</span>
            <Badge variant="secondary" className="ml-1">
              {getTabCount('paused')}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center space-x-2">
            <span>All</span>
            <Badge variant="secondary" className="ml-1">
              {getTabCount('all')}
            </Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredListings.length > 0 ? (
            <div className="space-y-4">
              {filteredListings.map((listing) => (
                <ListingCardComponent key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No listings found
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchQuery 
                    ? `No listings match your search "${searchQuery}"`
                    : `You don't have any ${activeTab} listings yet.`
                  }
                </p>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Create Your First Listing</span>
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </motion.div>

      {/* Bulk Actions */}
      {filteredListings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Bulk Actions</CardTitle>
            <CardDescription>
              Perform actions on multiple listings at once
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                Pause Selected
              </Button>
              <Button variant="outline" size="sm">
                Resume Selected
              </Button>
              <Button variant="outline" size="sm">
                Renew Selected
              </Button>
              <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                Delete Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}