'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Eye,
  ShoppingCart,
  Users,
  Star,
  Calendar,
  Target,
  Award,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

// Mock data for charts
const revenueData = [
  { date: '2024-01-01', revenue: 120, orders: 8 },
  { date: '2024-01-02', revenue: 180, orders: 12 },
  { date: '2024-01-03', revenue: 95, orders: 6 },
  { date: '2024-01-04', revenue: 220, orders: 15 },
  { date: '2024-01-05', revenue: 160, orders: 10 },
  { date: '2024-01-06', revenue: 280, orders: 18 },
  { date: '2024-01-07', revenue: 340, orders: 22 },
  { date: '2024-01-08', revenue: 190, orders: 13 },
  { date: '2024-01-09', revenue: 250, orders: 16 },
  { date: '2024-01-10', revenue: 300, orders: 20 },
  { date: '2024-01-11', revenue: 420, orders: 28 },
  { date: '2024-01-12', revenue: 380, orders: 25 },
  { date: '2024-01-13', revenue: 290, orders: 19 },
  { date: '2024-01-14', revenue: 350, orders: 23 }
];

const topListingsData = [
  { name: 'CS2 AK-47 Redline', revenue: 1250, sales: 28, views: 450, conversion: 6.2 },
  { name: 'Valorant Immortal Account', revenue: 980, sales: 8, views: 320, conversion: 2.5 },
  { name: 'Fortnite V-Bucks Package', revenue: 750, sales: 45, views: 890, conversion: 5.1 },
  { name: 'League Diamond Account', revenue: 680, sales: 12, views: 280, conversion: 4.3 },
  { name: 'Apex Legends Heirloom', revenue: 520, sales: 6, views: 180, conversion: 3.3 }
];

const gameDistribution = [
  { name: 'CS2', value: 35, color: '#00D4FF' },
  { name: 'Valorant', value: 25, color: '#FFD700' },
  { name: 'Fortnite', value: 20, color: '#1A2332' },
  { name: 'League of Legends', value: 15, color: '#00FF88' },
  { name: 'Others', value: 5, color: '#FF6B6B' }
];

const customerInsights = [
  { metric: 'Repeat Customers', value: '68%', change: '+12%', trend: 'up' },
  { metric: 'Avg. Order Value', value: '$45.20', change: '+8%', trend: 'up' },
  { metric: 'Customer Rating', value: '4.7/5.0', change: '+0.2', trend: 'up' },
  { metric: 'Response Time', value: '2.3h', change: '-15%', trend: 'up' }
];

function MetricCard({ 
  title, 
  value, 
  change, 
  trend, 
  icon: Icon 
}: { 
  title: string; 
  value: string; 
  change: string; 
  trend: 'up' | 'down'; 
  icon: React.ElementType;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">{title}</span>
          </div>
          <div className={`flex items-center space-x-1 ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            <span className="text-xs font-medium">{change}</span>
          </div>
        </div>
        <p className="text-2xl font-bold mt-2">{value}</p>
      </CardContent>
    </Card>
  );
}

function TopListingsTable() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Award className="h-5 w-5" />
          <span>Top Performing Listings</span>
        </CardTitle>
        <CardDescription>
          Your best-selling items and their performance metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topListingsData.map((listing, index) => (
            <div key={listing.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full">
                  <span className="text-sm font-bold text-primary">#{index + 1}</span>
                </div>
                <div>
                  <h4 className="font-medium">{listing.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {listing.sales} sales • {listing.views} views
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-600">${listing.revenue}</p>
                <p className="text-sm text-muted-foreground">
                  {listing.conversion}% conversion
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Analytics() {
  const [timeframe, setTimeframe] = useState('7d');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
        <p className="text-muted-foreground">
          Track your performance and optimize your sales strategy
        </p>
      </div>

      {/* Timeframe Selector */}
      <div className="flex space-x-2">
        {['7d', '30d', '90d'].map((period) => (
          <Button
            key={period}
            variant={timeframe === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => setTimeframe(period)}
          >
            {period === '7d' && 'Last 7 Days'}
            {period === '30d' && 'Last 30 Days'}
            {period === '90d' && 'Last 90 Days'}
          </Button>
        ))}
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value="$3,240"
          change="+23%"
          trend="up"
          icon={DollarSign}
        />
        <MetricCard
          title="Total Views"
          value="12,450"
          change="+18%"
          trend="up"
          icon={Eye}
        />
        <MetricCard
          title="Conversion Rate"
          value="4.2%"
          change="+0.8%"
          trend="up"
          icon={Target}
        />
        <MetricCard
          title="Active Listings"
          value="24"
          change="+3"
          trend="up"
          icon={ShoppingCart}
        />
      </div>

      {/* Charts Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Revenue Trend</span>
            </CardTitle>
            <CardDescription>
              Daily revenue and order volume over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value, name) => [
                    name === 'revenue' ? `$${value}` : value,
                    name === 'revenue' ? 'Revenue' : 'Orders'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#00D4FF" 
                  fill="#00D4FF" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Game Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Sales by Game</span>
            </CardTitle>
            <CardDescription>
              Distribution of sales across different games
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={gameDistribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {gameDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`${value}%`, 'Share']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Top Listings */}
        <div className="lg:col-span-2">
          <TopListingsTable />
        </div>

        {/* Customer Insights */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Star className="h-5 w-5" />
              <span>Customer Insights</span>
            </CardTitle>
            <CardDescription>
              Key metrics about your customer relationships
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {customerInsights.map((insight) => (
                <div key={insight.metric} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{insight.metric}</span>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold">{insight.value}</span>
                    <Badge 
                      variant={insight.trend === 'up' ? 'default' : 'destructive'}
                      className="text-xs"
                    >
                      {insight.change}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5" />
            <span>Performance Summary</span>
          </CardTitle>
          <CardDescription>
            Weekly performance breakdown and trends
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData.slice(-7)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short' })}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value, name) => [
                  name === 'revenue' ? `$${value}` : value,
                  name === 'revenue' ? 'Revenue' : 'Orders'
                ]}
              />
              <Bar dataKey="revenue" fill="#00D4FF" />
              <Bar dataKey="orders" fill="#FFD700" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}