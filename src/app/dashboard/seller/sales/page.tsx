'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Clock,
  CheckCircle,
  AlertCircle,
  Upload,
  MessageSquare,
  Star,
  DollarSign,
  User,
  Package,
  Calendar,
  FileVideo,
  Shield
} from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface Order {
  id: string;
  buyerName: string;
  buyerRating: number;
  itemTitle: string;
  itemThumbnail: string;
  amount: number;
  status: 'new' | 'in_progress' | 'awaiting_confirmation' | 'completed' | 'disputed';
  createdAt: string;
  escrowDeadline?: string;
  proofUploaded?: boolean;
  messages: number;
}

const mockOrders: Order[] = [
  {
    id: 'VG-2024-001',
    buyerName: 'GamerPro123',
    buyerRating: 4.7,
    itemTitle: 'CS2 AK-47 Redline (Field-Tested)',
    itemThumbnail: '/logo.png',
    amount: 45.99,
    status: 'awaiting_confirmation',
    createdAt: '2024-01-15T10:30:00Z',
    escrowDeadline: '2024-01-16T10:30:00Z',
    proofUploaded: true,
    messages: 2
  },
  {
    id: 'VG-2024-002',
    buyerName: 'ValPlayer456',
    buyerRating: 4.9,
    itemTitle: 'Valorant Account - Immortal Rank',
    itemThumbnail: '/logo.png',
    amount: 120.00,
    status: 'in_progress',
    createdAt: '2024-01-14T15:20:00Z',
    escrowDeadline: '2024-01-17T15:20:00Z',
    proofUploaded: false,
    messages: 5
  },
  {
    id: 'VG-2024-003',
    buyerName: 'FortniteKing',
    buyerRating: 4.2,
    itemTitle: 'Fortnite V-Bucks 2800 Package',
    itemThumbnail: '/logo.png',
    amount: 19.99,
    status: 'new',
    createdAt: '2024-01-14T09:15:00Z',
    messages: 0
  },
  {
    id: 'VG-2024-004',
    buyerName: 'LeagueChamp',
    buyerRating: 5.0,
    itemTitle: 'League of Legends Account - Diamond',
    itemThumbnail: '/logo.png',
    amount: 85.50,
    status: 'completed',
    createdAt: '2024-01-10T14:45:00Z',
    messages: 3
  }
];

function getStatusBadge(status: string) {
  const variants = {
    new: { variant: 'secondary' as const, label: 'New', icon: AlertCircle },
    in_progress: { variant: 'default' as const, label: 'In Progress', icon: Clock },
    awaiting_confirmation: { variant: 'outline' as const, label: 'Awaiting Confirmation', icon: Clock },
    completed: { variant: 'default' as const, label: 'Completed', icon: CheckCircle },
    disputed: { variant: 'destructive' as const, label: 'Disputed', icon: AlertCircle }
  };
  
  const config = variants[status as keyof typeof variants] || variants.new;
  const IconComponent = config.icon;
  
  return (
    <Badge variant={config.variant} className="flex items-center space-x-1">
      <IconComponent className="h-3 w-3" />
      <span>{config.label}</span>
    </Badge>
  );
}

function ProofUploadDialog({ orderId }: { orderId: string }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" className="flex items-center space-x-1">
          <Upload className="h-3 w-3" />
          <span>Upload Proof</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Delivery Proof</DialogTitle>
          <DialogDescription>
            Upload video proof of item delivery for order {orderId}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
            <FileVideo className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Drop your video file here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              Max 100MB, 60 seconds, MP4/MOV format
            </p>
            <Input
              type="file"
              accept="video/*"
              className="mt-4"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            />
          </div>
          
          {selectedFile && (
            <div className="p-3 bg-accent rounded-lg">
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg">
            <h4 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
              Video Guidelines:
            </h4>
            <ul className="text-xs text-blue-600 dark:text-blue-300 space-y-1">
              <li>• Show the item being transferred to buyer's account</li>
              <li>• Include timestamp and buyer's username</li>
              <li>• Ensure video is clear and unedited</li>
              <li>• Record the entire transaction process</li>
            </ul>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
            <Button size="sm" disabled={!selectedFile}>
              Upload Proof
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function OrderCard({ order }: { order: Order }) {
  const timeRemaining = order.escrowDeadline 
    ? Math.max(0, Math.floor((new Date(order.escrowDeadline).getTime() - Date.now()) / (1000 * 60 * 60)))
    : 0;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex space-x-4">
          {/* Item Thumbnail */}
          <div className="flex-shrink-0">
            <div className="w-16 h-16 bg-accent rounded-lg overflow-hidden">
              <Image
                src={order.itemThumbnail}
                alt={order.itemTitle}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Order Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-foreground truncate">
                  {order.itemTitle}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Order #{order.id}
                </p>
              </div>
              {getStatusBadge(order.status)}
            </div>

            {/* Buyer Info */}
            <div className="flex items-center space-x-4 mb-3">
              <div className="flex items-center space-x-2">
                <User className="h-3 w-3 text-muted-foreground" />
                <span className="text-sm text-foreground">{order.buyerName}</span>
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs text-muted-foreground">{order.buyerRating}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <DollarSign className="h-3 w-3 text-green-500" />
                <span className="text-sm font-medium text-green-600">
                  ${order.amount}
                </span>
              </div>
            </div>

            {/* Escrow Timer */}
            {order.escrowDeadline && order.status !== 'completed' && (
              <div className="flex items-center space-x-2 mb-3 p-2 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                <Shield className="h-4 w-4 text-orange-500" />
                <span className="text-sm text-orange-700 dark:text-orange-400">
                  Escrow: {timeRemaining}h remaining
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center space-x-2">
              {order.status === 'new' && (
                <Button size="sm" className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Accept Order</span>
                </Button>
              )}
              
              {order.status === 'in_progress' && !order.proofUploaded && (
                <ProofUploadDialog orderId={order.id} />
              )}
              
              {order.status === 'in_progress' && order.proofUploaded && (
                <Button size="sm" className="flex items-center space-x-1">
                  <CheckCircle className="h-3 w-3" />
                  <span>Mark Delivered</span>
                </Button>
              )}

              {order.status === 'awaiting_confirmation' && (
                <Badge variant="outline" className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Awaiting Buyer</span>
                </Badge>
              )}

              <Button variant="outline" size="sm" className="flex items-center space-x-1">
                <MessageSquare className="h-3 w-3" />
                <span>Message</span>
                {order.messages > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {order.messages}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SalesOrders() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredOrders = mockOrders.filter(order => {
    if (activeTab === 'all') return true;
    return order.status === activeTab;
  });

  const getTabCount = (status: string) => {
    if (status === 'all') return mockOrders.length;
    return mockOrders.filter(order => order.status === status).length;
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
        <h2 className="text-3xl font-bold tracking-tight">Sales & Orders</h2>
        <p className="text-muted-foreground">
          Manage your transactions and customer orders
        </p>
      </motion.div>

      {/* Order Pipeline Overview */}
      <motion.div 
        className="grid gap-4 md:grid-cols-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">New Orders</span>
            </div>
            <p className="text-2xl font-bold mt-2">{getTabCount('new')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium">In Progress</span>
            </div>
            <p className="text-2xl font-bold mt-2">{getTabCount('in_progress')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium">Awaiting Confirmation</span>
            </div>
            <p className="text-2xl font-bold mt-2">{getTabCount('awaiting_confirmation')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium">Completed</span>
            </div>
            <p className="text-2xl font-bold mt-2">{getTabCount('completed')}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Orders Tabs */}
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="all">
            All ({getTabCount('all')})
          </TabsTrigger>
          <TabsTrigger value="new">
            New ({getTabCount('new')})
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress ({getTabCount('in_progress')})
          </TabsTrigger>
          <TabsTrigger value="awaiting_confirmation">
            Awaiting ({getTabCount('awaiting_confirmation')})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({getTabCount('completed')})
          </TabsTrigger>
          <TabsTrigger value="disputed">
            Disputed ({getTabCount('disputed')})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {filteredOrders.length > 0 ? (
            <div className="space-y-4">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Package className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No orders found
                </h3>
                <p className="text-muted-foreground text-center">
                  {activeTab === 'all' 
                    ? "You don't have any orders yet."
                    : `No ${activeTab.replace('_', ' ')} orders at the moment.`
                  }
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </motion.div>
    </div>
  );
}