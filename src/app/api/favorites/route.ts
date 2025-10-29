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
        listing: {
          id: listings.id,
          title: listings.title,
          description: listings.description,
          price: listings.price,
          currency: listings.currency,
          images: listings.images,
          status: listings.status,
          createdAt: listings.createdAt,
          game: {
            id: games.id,
            name: games.name,
            slug: games.slug,
            icon: games.icon,
          },
          category: {
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
          },
          seller: {
            id: accounts.id,
            firstName: accounts.firstName,
            lastName: accounts.lastName,
            rating: accounts.rating,
            avatar: accounts.avatar,
          },
        },
      })
      .from(favorites)
      .innerJoin(listings, eq(favorites.listingId, listings.id))
      .innerJoin(games, eq(listings.gameId, games.id))
      .innerJoin(categories, eq(listings.categoryId, categories.id))
      .innerJoin(accounts, eq(listings.sellerId, accounts.id))
      .where(eq(favorites.userId, user[0].id))
      .orderBy(desc(favorites.createdAt));

    return NextResponse.json({ favorites: userFavorites });
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
        favorites: listing[0].favorites + 1,
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