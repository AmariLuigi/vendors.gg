const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const { eq, or } = require('drizzle-orm');

async function testSimpleGames() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is required');
      return;
    }

    console.log('Connecting to database...');
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);
    
    console.log('Running simple games query...');
    const gamesData = await sql`SELECT * FROM games LIMIT 1`;
    console.log('Games data:', gamesData);
    
    if (gamesData && gamesData.length > 0) {
      const game = gamesData[0];
      console.log('Testing categories query for game:', game.name);
      
      // Test the categories query that's failing
      const categoriesResult = await sql`
        SELECT id, name, description 
        FROM categories 
        WHERE game_id = ${game.id} OR game_id IS NULL
      `;
      console.log('Categories result:', categoriesResult);
      
      // Test if the result can be mapped
      console.log('Testing map operation...');
      const mapped = categoriesResult.map(cat => ({
        id: cat.id,
        name: cat.name,
        description: cat.description
      }));
      console.log('Mapped categories:', mapped);
    }
    
  } catch (error) {
    console.error('Database error:', error);
  }
}

testSimpleGames();