'use client';

import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { 
  Search, 
  Filter, 
  Star, 
  ShoppingCart, 
  Heart,
  Grid3X3,
  List,
  ChevronDown,
  SortAsc,
  SortDesc
} from 'lucide-react';

export default function BrowseGamesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedGame, setSelectedGame] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 1000]);
  const [sortBy, setSortBy] = useState('name');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Mock data for game items
  const gameItems = [
    {
      id: 1,
      name: 'Legendary Sword of Fire',
      game: 'World of Warcraft',
      category: 'Weapons',
      type: 'In-Game Items',
      price: 299.99,
      seller: 'ProGamer123',
      rating: 4.8,
      reviews: 156,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop&crop=center',
      description: 'Rare legendary weapon with fire damage bonus',
      rarity: 'Legendary',
      level: 85
    },
    {
      id: 2,
      name: 'Diamond Rank Account',
      game: 'League of Legends',
      category: 'Accounts',
      type: 'Game Accounts',
      price: 450.00,
      seller: 'RankMaster',
      rating: 4.9,
      reviews: 89,
      image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=300&h=200&fit=crop&crop=center',
      description: 'Diamond tier account with all champions unlocked',
      rarity: 'Premium',
      level: 30
    },
    {
      id: 3,
      name: 'Rare Pokemon Collection',
      game: 'Pokemon GO',
      category: 'Collections',
      type: 'In-Game Items',
      price: 125.50,
      seller: 'PokeMaster',
      rating: 4.7,
      reviews: 234,
      image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=300&h=200&fit=crop&crop=center',
      description: 'Collection of shiny and rare Pokemon',
      rarity: 'Rare',
      level: 40
    },
    {
      id: 4,
      name: 'CS:GO Knife Skin',
      game: 'Counter-Strike 2',
      category: 'Skins',
      type: 'Cosmetics',
      price: 750.00,
      seller: 'SkinTrader',
      rating: 4.6,
      reviews: 67,
      image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=200&fit=crop&crop=center',
      description: 'Factory New Karambit Fade knife skin',
      rarity: 'Covert',
      level: 1
    },
    {
      id: 5,
      name: 'Fortnite V-Bucks',
      game: 'Fortnite',
      category: 'Currency',
      type: 'In-Game Currency',
      price: 99.99,
      seller: 'VBuckStore',
      rating: 4.5,
      reviews: 445,
      image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&h=200&fit=crop&crop=center',
      description: '10,000 V-Bucks for Fortnite purchases',
      rarity: 'Common',
      level: 1
    },
    {
      id: 6,
      name: 'Minecraft Server Setup',
      game: 'Minecraft',
      category: 'Services',
      type: 'Game Services',
      price: 199.99,
      seller: 'ServerPro',
      rating: 4.9,
      reviews: 123,
      image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=300&h=200&fit=crop&crop=center',
      description: 'Professional Minecraft server setup and configuration',
      rarity: 'Service',
      level: 1
    }
  ];

  // Simple dropdown component to replace Select
  const SimpleSelect = ({ value, onValueChange, options, placeholder }: {
    value: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder: string;
  }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div className="relative">
        <Button
          variant="outline"
          className="w-full justify-between"
          onClick={() => setIsOpen(!isOpen)}
        >
          {options.find(opt => opt.value === value)?.label || placeholder}
          <ChevronDown className="h-4 w-4" />
        </Button>
        {isOpen && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border rounded-md shadow-lg">
            {options.map((option) => (
              <button
                key={option.value}
                className="w-full px-3 py-2 text-left hover:bg-accent hover:text-accent-foreground"
                onClick={() => {
                  onValueChange(option.value);
                  setIsOpen(false);
                }}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  const allItems = [
    {
      id: 1,
      name: "CS:GO Knife Skin",
      game: "Counter-Strike 2",
      type: "Cosmetics",
      category: "Skins",
      price: 750,
      rating: 4.6,
      reviews: 67,
      description: "Factory New Karambit Fade knife skin",
      seller: "SkinTrader",
      rarity: "Legendary",
      image: "🔪"
    },
    {
      id: 2,
      name: "Diamond Rank Account",
      game: "League of Legends",
      type: "Game Accounts",
      category: "Accounts",
      price: 450,
      rating: 4.9,
      reviews: 89,
      description: "Diamond tier account with all champions unlocked",
      seller: "RankMaster",
      rarity: "Rare",
      image: "💎"
    },
    {
      id: 3,
      name: "Fortnite V-Bucks",
      game: "Fortnite",
      type: "In Game Currency",
      category: "Currency",
      price: 99.99,
      rating: 4.5,
      reviews: 445,
      description: "10,000 V-Bucks for Fortnite purchases",
      seller: "VBuckStore",
      rarity: "Common",
      image: "💰"
    },
    {
      id: 4,
      name: "Rare Pokemon Cards",
      game: "Pokemon TCG",
      type: "Trading Cards",
      category: "Cards",
      price: 299,
      rating: 4.8,
      reviews: 156,
      description: "Collection of holographic rare Pokemon cards",
      seller: "CardCollector",
      rarity: "Epic",
      image: "🃏"
    },
    {
      id: 5,
      name: "Minecraft Server Setup",
      game: "Minecraft",
      type: "Services",
      category: "Services",
      price: 75,
      rating: 4.7,
      reviews: 234,
      description: "Professional Minecraft server configuration and setup",
      seller: "ServerPro",
      rarity: "Common",
      image: "⚙️"
    },
    {
      id: 6,
      name: "Valorant Coaching",
      game: "Valorant",
      type: "Services",
      category: "Services",
      price: 120,
      rating: 4.9,
      reviews: 78,
      description: "1-on-1 coaching session with professional Valorant player",
      seller: "ProCoach",
      rarity: "Rare",
      image: "🎯"
    }
  ];

  const games = [
    'All Games',
    'Counter-Strike 2',
    'League of Legends',
    'Fortnite',
    'Pokemon TCG',
    'Minecraft',
    'Valorant'
  ];

  const filteredItems = useMemo(() => {
    return gameItems.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.game.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.seller.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesType = selectedType === 'all' || item.type === selectedType;
      const matchesGame = selectedGame === 'all' || selectedGame === 'All Games' || item.game === selectedGame;
      const matchesPrice = item.price >= priceRange[0] && item.price <= priceRange[1];
      
      return matchesSearch && matchesCategory && matchesType && matchesGame && matchesPrice;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return a.price - b.price;
        case 'price-high':
          return b.price - a.price;
        case 'rating':
          return b.rating - a.rating;
        case 'name':
        default:
          return a.name.localeCompare(b.name);
      }
    });
  }, [gameItems, searchTerm, selectedCategory, selectedType, selectedGame, priceRange, sortBy]);

  // Pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const ItemCard = ({ item }: { item: typeof gameItems[0] }) => {
    if (viewMode === 'list') {
      return (
        <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
          <CardContent className="p-6">
            <div className="flex items-center space-x-6">
              <div className="w-32 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                <img 
                  src={item.image} 
                  alt={item.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="text-xl font-semibold mb-1">{item.name}</h3>
                    <Badge variant="secondary" className="mb-2">{item.game}</Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-primary">${item.price}</div>
                  </div>
                </div>
                <p className="text-muted-foreground mb-3">{item.description}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="font-medium">{item.rating}</span>
                      <span className="text-muted-foreground">({item.reviews})</span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Heart className="w-4 h-4" />
                    </Button>
                    <Button size="sm">
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Buy Now
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
        <CardContent className="p-0">
          {/* Large image at the top */}
          <div className="w-full h-48 overflow-hidden rounded-t-lg bg-muted">
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
          
          <div className="p-6">
            <div className="flex items-start justify-between mb-3">
              <Badge variant="secondary" className="text-xs">{item.game}</Badge>
              <Badge variant="default" className="text-xs">{item.rarity}</Badge>
            </div>
            
            <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
              {item.name}
            </h3>
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {item.description}
            </p>
            
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-1">
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <span className="font-medium text-sm">{item.rating}</span>
                <span className="text-xs text-muted-foreground">({item.reviews})</span>
              </div>
              <Badge variant="outline" className="text-xs">{item.type}</Badge>
            </div>

            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-2xl font-bold text-primary">${item.price}</div>
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button size="sm">Buy</Button>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <span className="text-xs text-muted-foreground">by {item.seller}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold tracking-tight">Search Listings</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover amazing gaming items, accounts, and services from trusted sellers
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search games, items, or sellers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={viewMode === 'grid' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === 'list' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setViewMode('list')}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row gap-6">
                {/* Filters Sidebar */}
                <div className="lg:w-64 space-y-6">
                  <Card className="p-4">
                    <h3 className="font-semibold mb-4 flex items-center">
                      <Filter className="h-4 w-4 mr-2" />
                      Filters
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Category</label>
                        <SimpleSelect
                          value={selectedCategory}
                          onValueChange={setSelectedCategory}
                          placeholder="All Categories"
                          options={[
                            { value: 'all', label: 'All Categories' },
                            { value: 'Weapons', label: 'Weapons' },
                            { value: 'Accounts', label: 'Accounts' },
                            { value: 'Collections', label: 'Collections' },
                            { value: 'Skins', label: 'Skins' },
                            { value: 'Currency', label: 'Currency' },
                            { value: 'Services', label: 'Services' }
                          ]}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Game</label>
                        <SimpleSelect
                          value={selectedGame}
                          onValueChange={setSelectedGame}
                          placeholder="All Games"
                          options={games.map(game => ({
                            value: game === 'All Games' ? 'all' : game,
                            label: game
                          }))}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Type</label>
                        <SimpleSelect
                          value={selectedType}
                          onValueChange={setSelectedType}
                          placeholder="All Types"
                          options={[
                            { value: 'all', label: 'All Types' },
                            { value: 'Cosmetics', label: 'Cosmetics' },
                            { value: 'Game Accounts', label: 'Game Accounts' },
                            { value: 'In Game Currency', label: 'In Game Currency' },
                            { value: 'Trading Cards', label: 'Trading Cards' },
                            { value: 'Services', label: 'Services' }
                          ]}
                        />
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Price Range</label>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>${priceRange[0]}</span>
                            <span>${priceRange[1]}</span>
                          </div>
                          <Slider
                            value={priceRange}
                            onValueChange={setPriceRange}
                            min={0}
                            max={1000}
                            step={10}
                            className="w-full"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-sm font-medium mb-2 block">Sort By</label>
                        <SimpleSelect
                          value={sortBy}
                          onValueChange={setSortBy}
                          placeholder="Sort by"
                          options={[
                            { value: 'name', label: 'Name A-Z' },
                            { value: 'price-low', label: 'Price: Low to High' },
                            { value: 'price-high', label: 'Price: High to Low' },
                            { value: 'rating', label: 'Highest Rated' }
                          ]}
                        />
                      </div>
                    </div>
                  </Card>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-2xl font-bold">Browse Games & Items</h2>
                      <p className="text-muted-foreground">
                        Showing {paginatedItems.length} of {filteredItems.length} items
                      </p>
                    </div>
                  </div>

                  {/* Items Grid/List */}
                  <div className={
                    viewMode === 'grid' 
                      ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                      : 'space-y-4'
                  }>
                    {paginatedItems.map((item) => (
                      <ItemCard key={item.id} item={item} />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex justify-center items-center space-x-2 mt-8">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      <div className="flex space-x-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Button
                            key={page}
                            variant={currentPage === page ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                          >
                            {page}
                          </Button>
                        ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  )}

                  {filteredItems.length === 0 && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">🎮</div>
                      <h3 className="text-xl font-semibold mb-2">No items found</h3>
                      <p className="text-muted-foreground">
                        Try adjusting your search criteria or filters
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}