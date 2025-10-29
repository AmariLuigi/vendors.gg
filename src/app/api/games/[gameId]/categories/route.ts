import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, categories, subcategories } from '@/lib/db/schema';
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

    // Get all categories
    const gameCategories = await db
      .select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
      })
      .from(categories);

    // Get subcategories for each category, filtered by game
    const categoriesWithSubcategories = await Promise.all(
      gameCategories.map(async (category) => {
        const categorySubcategories = await db
          .select({
            id: subcategories.id,
            name: subcategories.name,
            slug: subcategories.slug,
          })
          .from(subcategories)
          .where(eq(subcategories.categoryId, category.id));

        // Filter subcategories by game (some are game-specific)
        const gameSpecificSubcategories = categorySubcategories.filter(
          (sub) => {
            // If it's a currency category, check for game-specific currencies
            if (category.name === 'Currency') {
              const gameName = game[0].name;
              
              // Path of Exile games - only show their specific currencies
              if (gameName === 'Path of Exile') {
                return ['Divines', 'Mirror of Kalandra'].includes(sub.name) && sub.slug.endsWith('-poe');
              } else if (gameName === 'Path of Exile 2') {
                return ['Divines', 'Mirror of Kalandra'].includes(sub.name) && sub.slug.endsWith('-poe2');
              }
              
              // Game-specific currency mapping
              switch (gameName) {
                case 'World of Warcraft':
                  return sub.name === 'Gold';
                case 'Diablo 4':
                  return sub.name === 'Gold';
                case 'Counter-Strike 2':
                  return sub.name === 'Credits';
                default:
                  // For any other games, show generic currencies but not PoE-specific ones
                  return !['Divines', 'Mirror of Kalandra'].includes(sub.name);
              }
            }
            return true; // Include all other subcategories
          }
        );

        return {
            id: category.id,
            name: category.name,
            slug: category.slug,
            subcategories: gameSpecificSubcategories,
          };
      })
    );

    return NextResponse.json({
      game: game[0],
      categories: categoriesWithSubcategories,
    });
  } catch (error) {
    console.error('Error fetching game categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game categories' },
      { status: 500 }
    );
  }
}