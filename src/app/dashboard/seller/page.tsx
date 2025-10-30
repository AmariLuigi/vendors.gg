'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DollarSign,
  Package,
  Clock,
  Star,
  TrendingUp,
  TrendingDown,
  Plus,
  ShoppingCart,
  Upload,
  Eye,
  MessageSquare,
  AlertCircle,
  Zap,
  BarChart3,
  AlertTriangle
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral';
  icon: React.ComponentType<{ className?: string }>;
}

function MetricCard({ title, value, change, changeType, icon: Icon }: MetricCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
          {changeType === 'positive' && <TrendingUp className="h-3 w-3 text-green-500" />}
          {changeType === 'negative' && <TrendingDown className="h-3 w-3 text-red-500" />}
          <span className={changeType === 'positive' ? 'text-green-500' : changeType === 'negative' ? 'text-red-500' : ''}>
            {change}
          </span>
          <span>from last month</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface ActivityItem {
  id: string;
  type: 'sale' | 'listing' | 'message' | 'review';
  title: string;
  description: string;
  time: string;
  amount?: string;
}

const recentActivity: ActivityItem[] = [
  {
    id: '1',
    type: 'sale',
    title: 'CS2 AK-47 Redline sold',
    description: 'Sold to @GamerPro123',
    time: '2 hours ago',
    amount: '$45.99'
  },
  {
    id: '2',
    type: 'message',
    title: 'New message from buyer',
    description: 'Question about Valorant account',
    time: '4 hours ago'
  },
  {
    id: '3',
    type: 'listing',
    title: 'New listing created',
    description: 'Fortnite V-Bucks Package',
    time: '1 day ago'
  },
  {
    id: '4',
    type: 'review',
    title: 'New 5-star review',
    description: 'Great seller, fast delivery!',
    time: '2 days ago'
  }
];

function getActivityIcon(type: string) {
  switch (type) {
    case 'sale':
      return <DollarSign className="h-4 w-4 text-green-500" />;
    case 'message':
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case 'listing':
      return <Package className="h-4 w-4 text-purple-500" />;
    case 'review':
      return <Star className="h-4 w-4 text-yellow-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
}

export default function SellerDashboard() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <motion.div 
        className="flex flex-col space-y-2"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
        <p className="text-muted-foreground">
          Here's what's happening with your gaming marketplace today.
        </p>
      </motion.div>

      {/* Key Metrics */}
      <motion.div 
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.7 }}
      >
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-sm font-medium text-muted-foreground">Total Earnings</span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">$3,240.50</p>
              <p className="text-xs text-green-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +12.5% from last month
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Package className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-muted-foreground">Active Listings</span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">24</p>
              <p className="text-xs text-blue-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +3 this week
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <ShoppingCart className="h-4 w-4 text-orange-500" />
              <span className="text-sm font-medium text-muted-foreground">Pending Orders</span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">7</p>
              <p className="text-xs text-orange-600 flex items-center mt-1">
                <AlertCircle className="h-3 w-3 mr-1" />
                3 urgent
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium text-muted-foreground">Seller Rating</span>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold">4.8/5.0</p>
              <p className="text-xs text-yellow-600 flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1" />
                +0.2 this month
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <motion.div 
        className="grid gap-6 lg:grid-cols-3"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.9 }}
      >
        {/* Recent Activity - Takes 2 columns on large screens */}
        <div className="lg:col-span-2">
           <Card>
             <CardHeader>
               <CardTitle>Recent Activity</CardTitle>
               <CardDescription>
                 Your latest marketplace activities
               </CardDescription>
             </CardHeader>
             <CardContent>
               <div className="space-y-4">
                 {recentActivity.map((activity) => (
                   <div key={activity.id} className="flex items-start space-x-3">
                     <div className="flex-shrink-0 mt-1">
                       {getActivityIcon(activity.type)}
                     </div>
                     <div className="flex-1 min-w-0">
                       <div className="flex items-center justify-between">
                         <p className="text-sm font-medium text-foreground">
                           {activity.title}
                         </p>
                         {activity.amount && (
                           <Badge variant="secondary" className="ml-2">
                             {activity.amount}
                           </Badge>
                         )}
                       </div>
                       <p className="text-sm text-muted-foreground">
                         {activity.description}
                       </p>
                       <p className="text-xs text-muted-foreground mt-1">
                         {activity.time}
                       </p>
                     </div>
                   </div>
                 ))}
               </div>
             </CardContent>
           </Card>
         </div>

        {/* Quick Actions & Performance Summary */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Zap className="h-5 w-5" />
                <span>Quick Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Create New Listing
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Check Orders
              </Button>
            </CardContent>
          </Card>

          {/* Performance Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Performance</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>This Week</span>
                  <span className="font-medium">$890</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-primary h-2 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monthly Goal</span>
                  <span className="font-medium">$2,400 / $3,000</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-2">
                  <div className="bg-green-500 h-2 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Urgent Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-red-600 dark:text-red-400">
                <AlertTriangle className="h-5 w-5" />
                <span>Urgent Actions</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted/80 rounded-lg transition-colors">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-foreground">3 orders expiring soon</span>
                </div>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-muted/50 hover:bg-muted/80 rounded-lg transition-colors">
                <div className="flex items-center space-x-2">
                  <MessageSquare className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-foreground">2 unread messages</span>
                </div>
                <Button size="sm" variant="outline">
                  Reply
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>
    </div>
  );
}