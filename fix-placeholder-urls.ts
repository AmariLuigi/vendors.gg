import { db } from './src/lib/db/index';
import { listings } from './src/lib/db/schema';
import { sql } from 'drizzle-orm';

async function fixPlaceholderUrls() {
  try {
    console.log('🔍 Checking for listings with via.placeholder.com URLs...');
    
    // Find listings with via.placeholder.com URLs using JSONB contains
    const listingsWithPlaceholder = await db
      .select()
      .from(listings)
      .where(sql`${listings.images}::text LIKE '%via.placeholder.com%'`);
    
    console.log(`📋 Found ${listingsWithPlaceholder.length} listings with via.placeholder.com URLs`);
    
    if (listingsWithPlaceholder.length > 0) {
      // Update each listing
      for (const listing of listingsWithPlaceholder) {
        let updatedImages = listing.images;
        
        // Parse the JSON array if it's a string
        if (typeof updatedImages === 'string') {
          try {
            updatedImages = JSON.parse(updatedImages);
          } catch (e) {
            console.log(`⚠️ Could not parse images for listing ${listing.id}`);
            continue;
          }
        }
        
        // Update the array if it's an array
        if (Array.isArray(updatedImages)) {
          const newImages = updatedImages.map(imageUrl => {
            if (typeof imageUrl === 'string' && imageUrl.includes('via.placeholder.com')) {
              if (imageUrl.includes('Divine+Orb')) {
                return '/placeholder-divine-orb.svg';
              } else {
                return '/placeholder-item.svg';
              }
            }
            return imageUrl;
          });
          
          // Check if any changes were made
          const hasChanges = JSON.stringify(newImages) !== JSON.stringify(updatedImages);
          
          if (hasChanges) {
            await db
              .update(listings)
              .set({ images: JSON.stringify(newImages) })
              .where(sql`${listings.id} = ${listing.id}`);
            
            console.log(`✅ Updated listing ${listing.id}: ${listing.title}`);
            console.log(`   Old: ${JSON.stringify(updatedImages)}`);
            console.log(`   New: ${JSON.stringify(newImages)}`);
          }
        }
      }
    }
    
    console.log('🎉 Placeholder URL fix completed!');
  } catch (error) {
    console.error('❌ Error fixing placeholder URLs:', error);
  }
}

fixPlaceholderUrls();