'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import VendorLogo from '@/components/ui/vendor-logo';
import { Shield, Star, Users, Zap, ArrowRight, TrendingUp, Clock, CheckCircle, Search, Plus, Minus } from 'lucide-react';

export default function Home() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  
  const allGames = [
    { name: 'New World', items: '2.8K+', color: 'bg-amber-600' },
    { name: 'Warborne', items: '1.5K+', color: 'bg-orange-600' },
    { name: 'Path Of Exile II', items: '3.2K+', color: 'bg-purple-600' },
    { name: 'Path Of Exile', items: '2.1K+', color: 'bg-purple-500' },
    { name: 'Throne And Liberty', items: '1.9K+', color: 'bg-blue-600' },
    { name: 'Lost Ark', items: '2.4K+', color: 'bg-yellow-500' },
    { name: 'Ragnarok Latam', items: '800+', color: 'bg-red-500' },
    { name: 'RavenQuest', items: '650+', color: 'bg-gray-600' },
    { name: 'Albion', items: '1.7K+', color: 'bg-green-600' },
    { name: 'Diablo IV', items: '2.2K+', color: 'bg-red-600' },
    { name: 'Last Epoch', items: '1.1K+', color: 'bg-indigo-600' },
    { name: 'Torchlight Infinite', items: '900+', color: 'bg-orange-500' },
    { name: 'Hero Siege', items: '750+', color: 'bg-yellow-600' },
    { name: 'World Of Warcraft', items: '4.1K+', color: 'bg-blue-500' },
    { name: 'Ashes Of Creation', items: '1.3K+', color: 'bg-gray-500' },
    { name: 'Blade And Souls NEO', items: '850+', color: 'bg-cyan-600' },
    { name: 'Revendawn', items: '1.0K+', color: 'bg-emerald-600' },
    { name: 'Rs3 Osrs', items: '3.5K+', color: 'bg-yellow-500' },
    { name: 'Odin Valhalla Rising', items: '1.2K+', color: 'bg-blue-700' },
    { name: 'ROM', items: '950+', color: 'bg-cyan-500' },
  ];

  const filteredGames = useMemo(() => {
    if (!searchTerm) return allGames;
    return allGames.filter(game => 
      game.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const displayedGames = searchTerm ? filteredGames : (isExpanded ? filteredGames : filteredGames.slice(0, 5));
  const hasMoreGames = !searchTerm && !isExpanded && allGames.length > 5;

  const handleExpandToggle = () => {
    setIsExpanded(!isExpanded);
  };
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-accent/5 py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  🎮 Trusted Gaming Marketplace
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
                  Trade Gaming Items with{' '}
                  <span className="text-primary">Complete Security</span>
                </h1>
                <p className="text-xl text-muted-foreground leading-relaxed">
                  Buy and sell gaming accounts, items, and services with confidence. 
                  Every transaction is protected by our secure escrow system.
                </p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/games">
                  <Button size="lg" className="w-full sm:w-auto">
                    Browse Marketplace
                    <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </Link>
                <Link href="/sell">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Start Selling
                  </Button>
                </Link>
              </div>

              <div className="flex items-center space-x-8 text-sm">
                <div className="flex items-center space-x-2">
                  <Shield className="w-5 h-5 text-accent" />
                  <span className="font-medium">100% Secure</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Star className="w-5 h-5 text-accent" />
                  <span className="font-medium">Verified Sellers</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-5 h-5 text-accent" />
                  <span className="font-medium">50K+ Users</span>
                </div>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                <VendorLogo size="xl" className="w-64 h-64 lg:w-80 lg:h-80" />
                <div className="absolute -top-4 -right-4 animate-bounce">
                  <div className="bg-accent text-accent-foreground px-3 py-1 rounded-full text-sm font-medium">
                    Trusted!
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Games Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold">Popular Games</h2>
            <p className="text-xl text-muted-foreground">
              Find items for your favorite games
            </p>
            
            {/* Search Bar */}
            <div className="max-w-md mx-auto mt-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Search games..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-4 max-w-4xl mx-auto">
            {displayedGames.map((game, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group w-48">
                <CardContent className="p-4 text-center">
                  <div className={`w-12 h-12 ${game.color} rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform`}>
                    <span className="text-lg">🎮</span>
                  </div>
                  <h3 className="font-semibold mb-1 text-sm">{game.name}</h3>
                  <p className="text-xs text-muted-foreground">{game.items} items</p>
                </CardContent>
              </Card>
            ))}
            
            {/* Show More/Less Indicator */}
            {(hasMoreGames || isExpanded) && (
              <Card 
                className="hover:shadow-lg transition-shadow cursor-pointer group w-48 border-dashed border-2"
                onClick={handleExpandToggle}
              >
                <CardContent className="p-4 text-center flex flex-col items-center justify-center h-full">
                  <div className="w-12 h-12 bg-muted rounded-lg mx-auto mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                    {isExpanded ? (
                      <Minus className="h-6 w-6 text-muted-foreground" />
                    ) : (
                      <Plus className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>
                  <h3 className="font-semibold mb-1 text-sm text-muted-foreground">
                    {isExpanded ? 'Show less' : `+${allGames.length - 5} more`}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {isExpanded ? 'collapse list' : 'games available'}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </section>

      {/* Trust Factors Section */}
      <section className="py-16 lg:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold">Why Choose vendors.gg?</h2>
            <p className="text-xl text-muted-foreground">
              The most secure and trusted gaming marketplace
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Escrow Protection</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Your money is held safely until you confirm receipt of your items
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-accent" />
                </div>
                <CardTitle>Verified Sellers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  All sellers are verified and rated by our community
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-primary" />
                </div>
                <CardTitle>Fast Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Most items are delivered within minutes of purchase
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-accent" />
                </div>
                <CardTitle>24/7 Support</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Our support team is always here to help with any issues
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Recent Listings Section */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">Recent Listings</h2>
              <p className="text-xl text-muted-foreground">
                Fresh items from trusted sellers
              </p>
            </div>
            <Link href="/games">
              <Button variant="outline">
                View All
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                title: 'Diamond League Account',
                game: 'League of Legends',
                price: '$299',
                seller: 'ProGamer123',
                rating: 4.9,
                image: '💎'
              },
              {
                title: 'Mythic+ Ready Character',
                game: 'World of Warcraft',
                price: '$450',
                seller: 'WoWMaster',
                rating: 5.0,
                image: '⚔️'
              },
              {
                title: 'Radiant Rank Account',
                game: 'Valorant',
                price: '$599',
                seller: 'ValorantPro',
                rating: 4.8,
                image: '🎯'
              },
            ].map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="text-4xl">{item.image}</div>
                    <Badge variant="secondary">{item.game}</Badge>
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-primary">{item.price}</span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-accent fill-current" />
                      <span className="text-sm font-medium">{item.rating}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">by {item.seller}</span>
                    <Button size="sm">View Details</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 lg:py-24 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto space-y-8">
            <h2 className="text-3xl lg:text-4xl font-bold">
              Ready to Start Trading?
            </h2>
            <p className="text-xl opacity-90">
              Join thousands of gamers who trust vendors.gg for secure trading
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                  Create Account
                </Button>
              </Link>
              <Link href="/games">
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                  Browse Items
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
