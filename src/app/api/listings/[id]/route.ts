import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { listings, accounts, games, categories, subcategories, servers, leagues } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await db
      .select({
        id: listings.id,
        title: listings.title,
        description: listings.description,
        price: listings.price,
        currency: listings.currency,
        quantity: listings.quantity,
        rarity: listings.rarity,
        condition: listings.condition,
        negotiable: listings.negotiable,
        minimumPrice: listings.minimumPrice,
        bulkDiscount: listings.bulkDiscount,
        auctionMode: listings.auctionMode,
        auctionDuration: listings.auctionDuration,
        images: listings.images,
        videoProof: listings.videoProof,
        deliveryTime: listings.deliveryTime,
        deliveryMethod: listings.deliveryMethod,
        regions: listings.regions,
        minBuyerRating: listings.minBuyerRating,
        status: listings.status,
        views: listings.views,
        favorites: listings.favorites,
        createdAt: listings.createdAt,
        updatedAt: listings.updatedAt,
        seller: {
          id: accounts.id,
          firstName: accounts.firstName,
          lastName: accounts.lastName,
          rating: accounts.rating,
          totalReviews: accounts.totalReviews,
          avatar: accounts.avatar,
          bio: accounts.bio,
        },
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
        subcategory: {
          id: subcategories.id,
          name: subcategories.name,
          slug: subcategories.slug,
        },
        server: {
          id: servers.id,
          name: servers.name,
          region: servers.region,
        },
        league: {
          id: leagues.id,
          name: leagues.name,
          slug: leagues.slug,
        },
      })
      .from(listings)
      .leftJoin(accounts, eq(listings.sellerId, accounts.id))
      .leftJoin(games, eq(listings.gameId, games.id))
      .leftJoin(categories, eq(listings.categoryId, categories.id))
      .leftJoin(subcategories, eq(listings.subcategoryId, subcategories.id))
      .leftJoin(servers, eq(listings.serverId, servers.id))
      .leftJoin(leagues, eq(listings.leagueId, leagues.id))
      .where(eq(listings.id, id));

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await db
      .update(listings)
      .set({ views: (result[0].views || 0) + 1 })
      .where(eq(listings.id, id));

    return NextResponse.json({
      success: true,
      data: result[0],
    });

  } catch (error) {
    console.error('Error fetching listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listing' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // TODO: Add authentication middleware to verify seller ownership
    const {
      title,
      description,
      quantity,
      rarity,
      condition,
      price,
      currency,
      negotiable,
      minimumPrice,
      bulkDiscount,
      auctionMode,
      auctionDuration,
      images,
      videoProof,
      deliveryTime,
      deliveryMethod,
      regions,
      minBuyerRating,
      status,
    } = body;

    const updatedListing = await db
      .update(listings)
      .set({
        title,
        description,
        quantity,
        rarity,
        condition,
        price,
        currency,
        negotiable,
        minimumPrice,
        bulkDiscount,
        auctionMode,
        auctionDuration,
        images,
        videoProof,
        deliveryTime,
        deliveryMethod,
        regions,
        minBuyerRating,
        status,
        updatedAt: new Date(),
      })
      .where(eq(listings.id, id))
      .returning();

    if (updatedListing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedListing[0],
    });

  } catch (error) {
    console.error('Error updating listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update listing' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // TODO: Add authentication middleware to verify seller ownership
    const deletedListing = await db
      .delete(listings)
      .where(eq(listings.id, id))
      .returning();

    if (deletedListing.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Listing not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully',
    });

  } catch (error) {
    console.error('Error deleting listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete listing' },
      { status: 500 }
    );
  }
}