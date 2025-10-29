import { BrowseGamesClient } from './browse-games-client';
import { listingsAPI } from '@/lib/api';

export default async function GamesPage() {
  try {
    // Fetch listings data from the API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/listings?limit=50`, {
      cache: 'no-store', // Ensure fresh data on each request
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch listings');
    }
    
    const result = await response.json();
    const listingsData = result.success ? result.data : [];

    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse Game Listings</h1>
          <p className="text-muted-foreground">
            Discover and purchase gaming items, accounts, and services from verified sellers
          </p>
        </div>
        
        <BrowseGamesClient listingsData={listingsData} />
      </div>
    );
  } catch (error) {
    console.error('Error fetching listings:', error);
    
    // Fallback to empty data if API fails
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse Game Listings</h1>
          <p className="text-muted-foreground">
            Discover and purchase gaming items, accounts, and services from verified sellers
          </p>
        </div>
        
        <BrowseGamesClient listingsData={[]} />
      </div>
    );
  }
}