import { db } from './src/db/index.js';
import { inventori, transaksiJualBeli, users } from './src/db/schema.js';
import { eq, and } from 'drizzle-orm';

// Get the actual farmer user (Dimas) who is logged in - ID = 1
const userId = 1;

console.log('=== Checking all inventory ===');
const all = await db.select().from(inventori);
console.log('ALL inventory items in DB:', all.length);
all.forEach(i => console.log(`  id:${i.id} userId:${i.userId} "${i.item}" stock:${i.stock} cat:${i.category}`));

console.log('\n=== Farmer (userId=1) inventory ===');
const farmerItems = await db.select().from(inventori).where(eq(inventori.userId, userId));
console.log('Items:', farmerItems.length);

if (farmerItems.length > 0) {
  const testItem = farmerItems[0];
  console.log('Test item:', testItem);
  
  // test insert 
  try {
    const res = await db.insert(transaksiJualBeli).values({
      userId: userId,
      type: 'Jual',
      itemName: testItem.item,
      quantity: 5,
      pricePerUnit: 8000,
      totalNominal: 40000,
      status: 'Pending'
    }).returning();
    console.log('\nInsert result:', res);
  } catch(e) {
    console.log('\nInsert ERROR:', e.message);
    console.log('Detail:', e);
  }
} else {
  console.log('No inventory for userId=1, checking other farmers...');
  const farmer13 = await db.select().from(inventori).where(eq(inventori.userId, 13));
  console.log('userId=13 inventory:', farmer13.length, farmer13.map(i => `${i.item}:${i.stock}`));
}

process.exit(0);
