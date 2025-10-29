import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, leagues } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const { gameId } = await params;
    
    if (!gameId) {
      return NextResponse.json(
        { error: 'Invalid game ID' },
        { status: 400 }
      );
    }

    // First, get the game to check if it exists
    const game = await db
      .select()
      .from(games)
      .where(eq(games.id, gameId))
      .limit(1);

    if (game.length === 0) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      );
    }

    // Get leagues for this game
    const gameLeagues = await db
      .select({
        id: leagues.id,
        name: leagues.name,
        slug: leagues.slug,
        isActive: leagues.isActive,
        metadata: leagues.metadata,
        createdAt: leagues.createdAt,
        updatedAt: leagues.updatedAt,
      })
      .from(leagues)
      .where(eq(leagues.gameId, gameId));

    return NextResponse.json({
      game: game[0],
      leagues: gameLeagues,
    });
  } catch (error) {
    console.error('Error fetching game leagues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game leagues' },
      { status: 500 }
    );
  }
}