const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');
const bcrypt = require('bcryptjs');

async function createTestData() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is required');
      return;
    }

    console.log('Creating test data...');
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);

    // Create test seller account
    const hashedPassword = await bcrypt.hash('testpass123', 12);
    
    const sellerResult = await sql`
      INSERT INTO accounts (first_name, last_name, email, password, account_type, is_verified)
      VALUES ('Test', 'Seller', 'testseller@example.com', ${hashedPassword}, 'seller', true)
      ON CONFLICT (email) DO UPDATE SET 
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        account_type = EXCLUDED.account_type,
        is_verified = EXCLUDED.is_verified
      RETURNING id, email
    `;
    
    const buyerResult = await sql`
      INSERT INTO accounts (first_name, last_name, email, password, account_type, is_verified)
      VALUES ('Test', 'Buyer', 'testbuyer@example.com', ${hashedPassword}, 'buyer', true)
      ON CONFLICT (email) DO UPDATE SET 
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        account_type = EXCLUDED.account_type,
        is_verified = EXCLUDED.is_verified
      RETURNING id, email
    `;

    console.log('✅ Created test accounts:');
    console.log('Seller:', sellerResult[0]);
    console.log('Buyer:', buyerResult[0]);

    // Get game and category data for creating listings
    const gameData = await sql`SELECT id, name FROM games WHERE slug = 'poe' LIMIT 1`;
    console.log('Game data found:', gameData);
    
    if (gameData.length === 0) {
      console.error('No Path of Exile game data found. Please run the seed script first.');
      return;
    }

    const categoryData = await sql`SELECT id, name FROM categories WHERE game_id = ${gameData[0].id} OR game_id IS NULL LIMIT 1`;
    console.log('Category data found:', categoryData);
    
    if (categoryData.length === 0) {
      console.error('No category data found. Please run the seed script first.');
      return;
    }

    // Create test listing
    const listingResult = await sql`
      INSERT INTO listings (
        seller_id, game_id, category_id, title, description, price, currency,
        delivery_time, delivery_method, status, images
      )
      VALUES (
        ${sellerResult[0].id},
        ${gameData[0].id},
        ${categoryData[0].id},
        'Rare Divine Orb - Path of Exile',
        'High-quality Divine Orb for sale. Perfect for crafting end-game items. Fast delivery guaranteed!',
        25.99,
        'USD',
        '1-2 hours',
        'In-game trade',
        'active',
        '["https://via.placeholder.com/400x300/1a1a1a/ffffff?text=Divine+Orb"]'
      )
      ON CONFLICT DO NOTHING
      RETURNING id, title, price
    `;

    if (listingResult.length > 0) {
      console.log('✅ Created test listing:', listingResult[0]);
    } else {
      console.log('ℹ️ Test listing already exists or creation skipped');
    }

    console.log('🎉 Test data creation completed!');
    console.log('\nTest Accounts:');
    console.log('Seller: testseller@example.com / testpass123');
    console.log('Buyer: testbuyer@example.com / testpass123');

  } catch (error) {
    console.error('Error creating test data:', error);
  }
}

createTestData();