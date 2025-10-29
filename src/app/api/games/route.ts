import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { games, categories, subcategories } from '@/lib/db/schema';
import { eq, or, isNull } from 'drizzle-orm';

export async function GET() {
  try {
    console.log('Starting games API request...');
    
    // Get all games
    const gamesData = await db.select().from(games);
    console.log('Games data:', gamesData);
    
    if (!gamesData || gamesData.length === 0) {
      console.log('No games found, returning empty array');
      return NextResponse.json([]);
    }
    
    console.log('Processing games with categories...');
    const gamesWithCategories = await Promise.all(
      gamesData.map(async (game) => {
        console.log('Processing game:', game.name);
        // Get categories for this game (both game-specific and global categories)
        const gameCategories = await db
          .select({
            id: categories.id,
            name: categories.name,
            slug: categories.slug,
          })
          .from(categories)
          .where(
            or(
              eq(categories.gameId, game.id),
              isNull(categories.gameId)
            )
          );

        console.log(`Categories for ${game.name}:`, gameCategories);

        if (!gameCategories || gameCategories.length === 0) {
          console.log(`No categories found for ${game.name}, returning empty categories array`);
          return {
            id: game.id,
            name: game.name,
            slug: game.slug,
            icon: game.icon,
            has_servers: game.has_servers,
            has_leagues: game.has_leagues,
            created_at: game.created_at,
            updated_at: game.updated_at,
            categories: [],
          };
        }

        // Get subcategories for each category and this game
        const categoriesWithSubcategories = await Promise.all(
          gameCategories.map(async (category) => {
            console.log('Processing category:', category.name);
            const categorySubcategories = await db
              .select({
                id: subcategories.id,
                name: subcategories.name,
                slug: subcategories.slug,
              })
              .from(subcategories)
              .where(
                eq(subcategories.categoryId, category.id)
              );

            // Filter subcategories by game (some are game-specific)
            const gameSpecificSubcategories = categorySubcategories.filter(
              (sub) => {
                // If it's a currency category, check for game-specific currencies
                if (category.name === 'Currency') {
                  // PoE-specific currencies
                  if (['Divines', 'Mirror of Kalandra'].includes(sub.name)) {
                    return ['Path of Exile', 'Path of Exile 2'].includes(game.name);
                  }
                  // Generic currencies for other games
                  return !['Divines', 'Mirror of Kalandra'].includes(sub.name);
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

        return {
          id: game.id,
          name: game.name,
          slug: game.slug,
          icon: game.icon,
          has_servers: game.has_servers,
          has_leagues: game.has_leagues,
          created_at: game.created_at,
          updated_at: game.updated_at,
          categories: categoriesWithSubcategories,
        };
      })
    );

    return NextResponse.json(gamesWithCategories);
  } catch (error) {
    console.error('Error fetching games:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}