import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { favorites, listings, accounts, games, categories } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';

// GET /api/favorites - Get user's favorites
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user account
    const user = await db.select().from(accounts).where(eq(accounts.email, session.user.email)).limit(1);
    
    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get user's favorites with listing details
    const userFavorites = await db
      .select({
        id: favorites.id,
        createdAt: favorites.createdAt,
        listingId: listings.id,
        listingTitle: listings.title,
        listingDescription: listings.description,
        listingPrice: listings.price,
        listingCurrency: listings.currency,
        listingImages: listings.images,
        listingStatus: listings.status,
        listingCreatedAt: listings.createdAt,
        gameId: games.id,
        gameName: games.name,
        gameSlug: games.slug,
        gameIcon: games.icon,
        categoryId: categories.id,
        categoryName: categories.name,
        categorySlug: categories.slug,
        sellerId: accounts.id,
        sellerFirstName: accounts.firstName,
        sellerLastName: accounts.lastName,
        sellerRating: accounts.rating,
        sellerAvatar: accounts.avatar,
      })
      .from(favorites)
      .innerJoin(listings, eq(favorites.listingId, listings.id))
      .innerJoin(games, eq(listings.gameId, games.id))
      .innerJoin(categories, eq(listings.categoryId, categories.id))
      .innerJoin(accounts, eq(listings.sellerId, accounts.id))
      .where(eq(favorites.userId, user[0].id))
      .orderBy(desc(favorites.createdAt));

    // Reconstruct the nested structure
    const formattedFavorites = userFavorites.map(fav => ({
      id: fav.id,
      createdAt: fav.createdAt,
      listing: {
        id: fav.listingId,
        title: fav.listingTitle,
        description: fav.listingDescription,
        price: fav.listingPrice,
        currency: fav.listingCurrency,
        images: fav.listingImages,
        status: fav.listingStatus,
        createdAt: fav.listingCreatedAt,
        game: {
          id: fav.gameId,
          name: fav.gameName,
          slug: fav.gameSlug,
          icon: fav.gameIcon,
        },
        category: {
          id: fav.categoryId,
          name: fav.categoryName,
          slug: fav.categorySlug,
        },
        seller: {
          id: fav.sellerId,
          firstName: fav.sellerFirstName,
          lastName: fav.sellerLastName,
          rating: fav.sellerRating,
          avatar: fav.sellerAvatar,
        },
      },
    }));

    return NextResponse.json({ favorites: formattedFavorites });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/favorites - Add a listing to favorites
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId } = await request.json();

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 });
    }

    // Get user account
    const user = await db.select().from(accounts).where(eq(accounts.email, session.user.email)).limit(1);
    
    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if listing exists
    const listing = await db.select().from(listings).where(eq(listings.id, listingId)).limit(1);
    
    if (!listing.length) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Check if already favorited
    const existingFavorite = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.userId, user[0].id), eq(favorites.listingId, listingId)))
      .limit(1);

    if (existingFavorite.length > 0) {
      return NextResponse.json({ error: 'Listing already in favorites' }, { status: 409 });
    }

    // Add to favorites
    const newFavorite = await db
      .insert(favorites)
      .values({
        userId: user[0].id,
        listingId: listingId,
      })
      .returning();

    // Update listing favorites count
    await db
      .update(listings)
      .set({ 
        favorites: (listing[0].favorites || 0) + 1,
        updatedAt: new Date()
      })
      .where(eq(listings.id, listingId));

    return NextResponse.json({ 
      message: 'Added to favorites',
      favorite: newFavorite[0]
    }, { status: 201 });
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}