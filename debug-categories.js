const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');

async function testCategories() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is required');
      return;
    }

    console.log('Connecting to database...');
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);
    
    console.log('Running categories query...');
    const result = await sql`SELECT * FROM categories LIMIT 5`;
    console.log('Categories:', result);
    
    console.log('Running subcategories query...');
    const subResult = await sql`SELECT * FROM subcategories LIMIT 5`;
    console.log('Subcategories:', subResult);
    
  } catch (error) {
    console.error('Database error:', error);
  }
}

testCategories();