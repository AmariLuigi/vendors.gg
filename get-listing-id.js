const { neon } = require('@neondatabase/serverless');

async function getListingId() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    const result = await sql`SELECT id, title FROM listings ORDER BY created_at DESC LIMIT 1`;
    console.log('Latest listing:', result[0]);
  } catch (error) {
    console.error('Error:', error);
  }
}

getListingId();