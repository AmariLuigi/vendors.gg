import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, servers } from '@/lib/db/schema';
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

    // Get servers for this game
    const gameServers = await db
      .select({
        id: servers.id,
        name: servers.name,
        region: servers.region,
      })
      .from(servers)
      .where(eq(servers.gameId, gameId));

    return NextResponse.json({
      game: game[0],
      servers: gameServers,
    });
  } catch (error) {
    console.error('Error fetching game servers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game servers' },
      { status: 500 }
    );
  }
}