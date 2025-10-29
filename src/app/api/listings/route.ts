import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { listings, accounts, games, categories, subcategories, servers, leagues } from '@/lib/db/schema';
import { eq, and, like, gte, lte, desc, asc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    const game = searchParams.get('game') || '';
    const category = searchParams.get('category') || '';
    const subcategory = searchParams.get('subcategory') || '';
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const status = searchParams.get('status') || 'active';

    // Build query conditions
    const conditions = [eq(listings.status, status)];

    if (search) {
      conditions.push(like(listings.title, `%${search}%`));
    }

    if (minPrice) {
      conditions.push(gte(listings.price, minPrice));
    }

    if (maxPrice) {
      conditions.push(lte(listings.price, maxPrice));
    }

    // Build the query with joins
    let query = db
      .select({
        id: listings.id,
        title: listings.title,
        description: listings.description,
        price: listings.price,
        currency: listings.currency,
        quantity: listings.quantity,
        rarity: listings.rarity,
        condition: listings.condition,
        images: listings.images,
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
      .leftJoin(leagues, eq(listings.leagueId, leagues.id));

    // Apply filters
    if (game) {
      query = query.where(and(...conditions, eq(games.slug, game)));
    } else if (category) {
      query = query.where(and(...conditions, eq(categories.slug, category)));
    } else if (subcategory) {
      query = query.where(and(...conditions, eq(subcategories.slug, subcategory)));
    } else {
      query = query.where(and(...conditions));
    }

    // Apply sorting
    const orderColumn = sortBy === 'price' ? listings.price : 
                       sortBy === 'createdAt' ? listings.createdAt :
                       sortBy === 'views' ? listings.views :
                       listings.createdAt;
    
    query = query.orderBy(sortOrder === 'asc' ? asc(orderColumn) : desc(orderColumn));

    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.limit(limit).offset(offset);

    const results = await query;

    // Get total count for pagination
    const totalQuery = db
      .select({ count: listings.id })
      .from(listings)
      .leftJoin(games, eq(listings.gameId, games.id))
      .leftJoin(categories, eq(listings.categoryId, categories.id))
      .leftJoin(subcategories, eq(listings.subcategoryId, subcategories.id));

    let totalCountQuery = totalQuery;
    if (game) {
      totalCountQuery = totalCountQuery.where(and(...conditions, eq(games.slug, game)));
    } else if (category) {
      totalCountQuery = totalCountQuery.where(and(...conditions, eq(categories.slug, category)));
    } else if (subcategory) {
      totalCountQuery = totalCountQuery.where(and(...conditions, eq(subcategories.slug, subcategory)));
    } else {
      totalCountQuery = totalCountQuery.where(and(...conditions));
    }

    const totalCountResult = await totalCountQuery;
    const totalCount = totalCountResult.length;
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      data: results,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });

  } catch (error) {
    console.error('Error fetching listings:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // TODO: Add authentication middleware to get seller ID
    // For now, we'll expect sellerId to be provided in the request
    const {
      sellerId,
      gameId,
      serverId,
      leagueId,
      categoryId,
      subcategoryId,
      title,
      description,
      quantity = 1,
      rarity,
      condition,
      price,
      currency = 'USD',
      negotiable = false,
      minimumPrice,
      bulkDiscount,
      auctionMode = false,
      auctionDuration,
      images,
      videoProof,
      deliveryTime,
      deliveryMethod,
      regions,
      minBuyerRating,
      publishLater = false,
      autoRelist = false,
      scheduledDate,
    } = body;

    // Validate required fields
    if (!sellerId || !gameId || !categoryId || !title || !description || !price) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const newListing = await db.insert(listings).values({
      sellerId,
      gameId,
      serverId,
      leagueId,
      categoryId,
      subcategoryId,
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
      publishLater,
      autoRelist,
      scheduledDate,
      status: publishLater ? 'scheduled' : 'active',
    }).returning();

    return NextResponse.json({
      success: true,
      data: newListing[0],
    });

  } catch (error) {
    console.error('Error creating listing:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}