import { db } from './index';
import { games, categories, subcategories, servers, leagues } from './schema';

async function seed() {
  console.log('🌱 Seeding database...');

  try {
    // Clear existing data
    await db.delete(subcategories);
    await db.delete(categories);
    await db.delete(servers);
    await db.delete(leagues);
    await db.delete(games);

    // Insert games
    const gameData = await db.insert(games).values([
      {
        name: 'Path of Exile',
        slug: 'poe',
        icon: '⚔️',
        hasServers: true,
        hasLeagues: true,
      },
      {
        name: 'Path of Exile 2',
        slug: 'poe2',
        icon: '🗡️',
        hasServers: true,
        hasLeagues: true,
      },
      {
        name: 'World of Warcraft',
        slug: 'wow',
        icon: '🏰',
        hasServers: true,
        hasLeagues: false,
      },
      {
        name: 'Diablo 4',
        slug: 'diablo4',
        icon: '👹',
        hasServers: true,
        hasLeagues: false,
      },
      {
        name: 'Counter-Strike 2',
        slug: 'csgo',
        icon: '🔫',
        hasServers: true,
        hasLeagues: false,
      },
      {
        name: 'Valorant',
        slug: 'valorant',
        icon: '🎯',
        hasServers: true,
        hasLeagues: false,
      },
      {
        name: 'Genshin Impact',
        slug: 'genshin',
        icon: '⚡',
        hasServers: true,
        hasLeagues: false,
      },
    ]).returning();

    console.log(`✅ Inserted ${gameData.length} games`);

    // Get game IDs for reference
    const poeGame = gameData.find(g => g.slug === 'poe')!;
    const poe2Game = gameData.find(g => g.slug === 'poe2')!;
    const wowGame = gameData.find(g => g.slug === 'wow')!;
    const diablo4Game = gameData.find(g => g.slug === 'diablo4')!;
    const csgoGame = gameData.find(g => g.slug === 'csgo')!;
    const valorantGame = gameData.find(g => g.slug === 'valorant')!;
    const genshinGame = gameData.find(g => g.slug === 'genshin')!;

    // Insert categories
    const categoryData = await db.insert(categories).values([
      // Universal categories
      { name: 'Currency', slug: 'currency', gameId: null },
      { name: 'Items', slug: 'items', gameId: null },
      { name: 'Accounts', slug: 'accounts', gameId: null },
      { name: 'Services', slug: 'services', gameId: null },
    ]).returning();

    console.log(`✅ Inserted ${categoryData.length} categories`);

    const currencyCategory = categoryData.find(c => c.slug === 'currency')!;
    const itemsCategory = categoryData.find(c => c.slug === 'items')!;
    const accountsCategory = categoryData.find(c => c.slug === 'accounts')!;
    const servicesCategory = categoryData.find(c => c.slug === 'services')!;

    // Insert subcategories
    const subcategoryData = await db.insert(subcategories).values([
      // PoE Currency subcategories
      { name: 'Divines', slug: 'divines-poe', categoryId: currencyCategory.id, gameId: poeGame.id },
      { name: 'Mirror of Kalandra', slug: 'mirror-of-kalandra-poe', categoryId: currencyCategory.id, gameId: poeGame.id },
      
      // PoE2 Currency subcategories
      { name: 'Divines', slug: 'divines-poe2', categoryId: currencyCategory.id, gameId: poe2Game.id },
      { name: 'Mirror of Kalandra', slug: 'mirror-of-kalandra-poe2', categoryId: currencyCategory.id, gameId: poe2Game.id },
      
      // Generic currency for other games
      { name: 'Gold', slug: 'gold', categoryId: currencyCategory.id, gameId: wowGame.id },
      { name: 'V-Bucks', slug: 'v-bucks', categoryId: currencyCategory.id, gameId: null }, // For Fortnite when added
      { name: 'Credits', slug: 'credits', categoryId: currencyCategory.id, gameId: null },
      
      // Items subcategories
      { name: 'Weapons', slug: 'weapons', categoryId: itemsCategory.id, gameId: null },
      { name: 'Armor', slug: 'armor', categoryId: itemsCategory.id, gameId: null },
      { name: 'Accessories', slug: 'accessories', categoryId: itemsCategory.id, gameId: null },
      { name: 'Consumables', slug: 'consumables', categoryId: itemsCategory.id, gameId: null },
      { name: 'Materials', slug: 'materials', categoryId: itemsCategory.id, gameId: null },
      { name: 'Rare Items', slug: 'rare-items', categoryId: itemsCategory.id, gameId: null },
      
      // Accounts subcategories
      { name: 'Leveled Accounts', slug: 'leveled-accounts', categoryId: accountsCategory.id, gameId: null },
      { name: 'Ranked Accounts', slug: 'ranked-accounts', categoryId: accountsCategory.id, gameId: null },
      { name: 'Fresh Accounts', slug: 'fresh-accounts', categoryId: accountsCategory.id, gameId: null },
      { name: 'Starter Accounts', slug: 'starter-accounts', categoryId: accountsCategory.id, gameId: null },
      
      // Services subcategories
      { name: 'Boosting', slug: 'boosting', categoryId: servicesCategory.id, gameId: null },
      { name: 'Coaching', slug: 'coaching', categoryId: servicesCategory.id, gameId: null },
      { name: 'Farming', slug: 'farming', categoryId: servicesCategory.id, gameId: null },
      { name: 'Questing', slug: 'questing', categoryId: servicesCategory.id, gameId: null },
      { name: 'Achievement Unlocks', slug: 'achievement-unlocks', categoryId: servicesCategory.id, gameId: null },
    ]).returning();

    console.log(`✅ Inserted ${subcategoryData.length} subcategories`);

    // Insert servers
    const serverData = await db.insert(servers).values([
      // PoE servers
      { name: 'Standard', region: 'Global', gameId: poeGame.id },
      { name: 'Hardcore', region: 'Global', gameId: poeGame.id },
      { name: 'Solo Self-Found', region: 'Global', gameId: poeGame.id },
      
      // PoE2 servers
      { name: 'Standard', region: 'Global', gameId: poe2Game.id },
      { name: 'Hardcore', region: 'Global', gameId: poe2Game.id },
      { name: 'Solo Self-Found', region: 'Global', gameId: poe2Game.id },
      
      // WoW servers
      { name: 'Stormrage', region: 'US', gameId: wowGame.id },
      { name: 'Tichondrius', region: 'US', gameId: wowGame.id },
      { name: 'Area-52', region: 'US', gameId: wowGame.id },
      { name: "Mal'Ganis", region: 'US', gameId: wowGame.id },
      { name: 'Illidan', region: 'US', gameId: wowGame.id },
      
      // Diablo 4 servers
      { name: 'Americas', region: 'Americas', gameId: diablo4Game.id },
      { name: 'Europe', region: 'Europe', gameId: diablo4Game.id },
      { name: 'Asia', region: 'Asia', gameId: diablo4Game.id },
      
      // CS:GO servers
      { name: 'North America', region: 'NA', gameId: csgoGame.id },
      { name: 'Europe West', region: 'EU-W', gameId: csgoGame.id },
      { name: 'Europe East', region: 'EU-E', gameId: csgoGame.id },
      { name: 'Asia', region: 'AS', gameId: csgoGame.id },
      
      // Valorant servers
      { name: 'North America', region: 'NA', gameId: valorantGame.id },
      { name: 'Europe', region: 'EU', gameId: valorantGame.id },
      { name: 'Asia Pacific', region: 'AP', gameId: valorantGame.id },
      { name: 'Latin America', region: 'LATAM', gameId: valorantGame.id },
      
      // Genshin Impact servers
      { name: 'America', region: 'America', gameId: genshinGame.id },
      { name: 'Europe', region: 'Europe', gameId: genshinGame.id },
      { name: 'Asia', region: 'Asia', gameId: genshinGame.id },
      { name: 'TW/HK/MO', region: 'TW/HK/MO', gameId: genshinGame.id },
    ]).returning();

    console.log(`✅ Inserted ${serverData.length} servers`);

    // Insert leagues (for PoE games)
    const leagueData = await db.insert(leagues).values([
      // PoE leagues (these would be updated dynamically from the API)
      { name: 'Crucible', slug: 'crucible', gameId: poeGame.id, isActive: true },
      { name: 'Standard', slug: 'standard', gameId: poeGame.id, isActive: true },
      { name: 'Hardcore', slug: 'hardcore', gameId: poeGame.id, isActive: true },
      { name: 'Solo Self-Found', slug: 'solo-self-found', gameId: poeGame.id, isActive: true },
    ]).returning();

    console.log(`✅ Inserted ${leagueData.length} leagues`);

    console.log('🎉 Database seeded successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run the seed function
seed().catch((error) => {
  console.error('Seed failed:', error);
  process.exit(1);
});