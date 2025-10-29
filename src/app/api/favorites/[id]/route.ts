import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';
import { favorites, listings, accounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// DELETE /api/favorites/[id] - Remove a favorite
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const favoriteId = params.id;

    // Get user account
    const user = await db.select().from(accounts).where(eq(accounts.email, session.user.email)).limit(1);
    
    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get the favorite to ensure it belongs to the user
    const favorite = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.id, favoriteId), eq(favorites.userId, user[0].id)))
      .limit(1);

    if (!favorite.length) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    // Get the listing to update its favorites count
    const listing = await db
      .select()
      .from(listings)
      .where(eq(listings.id, favorite[0].listingId))
      .limit(1);

    // Delete the favorite
    await db
      .delete(favorites)
      .where(and(eq(favorites.id, favoriteId), eq(favorites.userId, user[0].id)));

    // Update listing favorites count
    if (listing.length > 0) {
      await db
        .update(listings)
        .set({ 
          favorites: Math.max(0, listing[0].favorites - 1),
          updatedAt: new Date()
        })
        .where(eq(listings.id, favorite[0].listingId));
    }

    return NextResponse.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Alternative DELETE by listing ID
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const listingId = params.id;

    // Get user account
    const user = await db.select().from(accounts).where(eq(accounts.email, session.user.email)).limit(1);
    
    if (!user.length) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find and delete the favorite by listing ID
    const favorite = await db
      .select()
      .from(favorites)
      .where(and(eq(favorites.listingId, listingId), eq(favorites.userId, user[0].id)))
      .limit(1);

    if (!favorite.length) {
      return NextResponse.json({ error: 'Favorite not found' }, { status: 404 });
    }

    // Get the listing to update its favorites count
    const listing = await db
      .select()
      .from(listings)
      .where(eq(listings.id, listingId))
      .limit(1);

    // Delete the favorite
    await db
      .delete(favorites)
      .where(and(eq(favorites.listingId, listingId), eq(favorites.userId, user[0].id)));

    // Update listing favorites count
    if (listing.length > 0) {
      await db
        .update(listings)
        .set({ 
          favorites: Math.max(0, listing[0].favorites - 1),
          updatedAt: new Date()
        })
        .where(eq(listings.id, listingId));
    }

    return NextResponse.json({ message: 'Removed from favorites' });
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}