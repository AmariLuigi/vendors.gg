const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');

async function testDb() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is required');
      return;
    }

    console.log('Connecting to database...');
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);
    
    console.log('Running query...');
    const result = await sql`SELECT * FROM games LIMIT 5`;
    console.log('Games:', result);
    
  } catch (error) {
    console.error('Database error:', error);
  }
}

testDb();