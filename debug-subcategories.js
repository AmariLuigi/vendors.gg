const { neon } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-http');

async function debugSubcategories() {
  try {
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL environment variable is required');
      return;
    }

    console.log('=== SUBCATEGORIES DEBUG ===');
    console.log('Connecting to database...');
    const sql = neon(process.env.DATABASE_URL);
    const db = drizzle(sql);
    
    console.log('Running query...');
    // Get all subcategories
    const allSubcategories = await sql`SELECT * FROM subcategories`;
    console.log('\nAll subcategories:');
    allSubcategories.forEach(sub => {
      console.log(`ID: ${sub.id}, Name: ${sub.name}, Slug: ${sub.slug}, GameId: ${sub.game_id}, CategoryId: ${sub.category_id}`);
    });

    // Check for duplicate names
    console.log('\n=== CHECKING FOR DUPLICATE NAMES ===');
    const nameGroups = {};
    allSubcategories.forEach(sub => {
      if (!nameGroups[sub.name]) {
        nameGroups[sub.name] = [];
      }
      nameGroups[sub.name].push(sub);
    });

    Object.keys(nameGroups).forEach(name => {
      if (nameGroups[name].length > 1) {
        console.log(`\nDUPLICATE NAME FOUND: "${name}"`);
        nameGroups[name].forEach(sub => {
          console.log(`  - ID: ${sub.id}, GameId: ${sub.game_id}, CategoryId: ${sub.category_id}`);
        });
      }
    });

    // Check for duplicate slugs
    console.log('\n=== CHECKING FOR DUPLICATE SLUGS ===');
    const slugGroups = {};
    allSubcategories.forEach(sub => {
      if (!slugGroups[sub.slug]) {
        slugGroups[sub.slug] = [];
      }
      slugGroups[sub.slug].push(sub);
    });

    Object.keys(slugGroups).forEach(slug => {
      if (slugGroups[slug].length > 1) {
        console.log(`\nDUPLICATE SLUG FOUND: "${slug}"`);
        slugGroups[slug].forEach(sub => {
          console.log(`  - ID: ${sub.id}, Name: ${sub.name}, GameId: ${sub.game_id}, CategoryId: ${sub.category_id}`);
        });
      }
    });

    console.log('\n=== DONE ===');
    
  } catch (error) {
    console.error('Database error:', error);
  }
}

debugSubcategories();