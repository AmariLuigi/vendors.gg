import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { listings } from './src/lib/db/schema.js';
import { like, sql } from 'drizzle-orm';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sqlClient = neon(process.env.DATABASE_URL);
const db = drizzle(sqlClient);

async function fixPlaceholderUrls() {
  try {
    console.log('Checking for listings with via.placeholder.com URLs...');
    
    // Find listings with via.placeholder.com URLs
    const listingsWithPlaceholder = await db
      .select()
      .from(listings)
      .where(like(listings.images, '%via.placeholder.com%'));
    
    console.log(`Found ${listingsWithPlaceholder.length} listings with via.placeholder.com URLs`);
    
    if (listingsWithPlaceholder.length > 0) {
      // Update each listing
      for (const listing of listingsWithPlaceholder) {
        let updatedImages = listing.images;
        
        // Replace specific Divine Orb placeholder
        updatedImages = updatedImages.replace(
          'https://via.placeholder.com/400x300/1a1a1a/ffffff?text=Divine+Orb',
          '/placeholder-divine-orb.svg'
        );
        
        // Replace generic placeholder
        updatedImages = updatedImages.replace(
          /https:\/\/via\.placeholder\.com\/[^"'\]]+/g,
          '/placeholder-item.svg'
        );
        
        if (updatedImages !== listing.images) {
          await db
            .update(listings)
            .set({ images: updatedImages })
            .where(sql`${listings.id} = ${listing.id}`);
          
          console.log(`Updated listing ${listing.id}: ${listing.title}`);
        }
      }
    }
    
    console.log('Placeholder URL fix completed!');
  } catch (error) {
    console.error('Error fixing placeholder URLs:', error.message);
  }
}

fixPlaceholderUrls();