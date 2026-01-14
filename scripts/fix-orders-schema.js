require('dotenv').config({path:'.env.local'});
const postgres = require('postgres');

async function addMissingColumns() {
  const DATABASE_URL = 
    process.env.POSTGRES_DATABASE_URL ||
    process.env.POSTGRES_DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_POSTGRES_URL ||
    process.env.POSTGRES_POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.POSTGRES_URL;

  if (!DATABASE_URL) {
    console.error('❌ No DATABASE_URL found');
    process.exit(1);
  }

  const sql = postgres(DATABASE_URL);
  
  console.log('🔄 Adding missing columns to orders table...');
  
  const alterStatements = [
    // Add order_number column with default for existing rows
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number text`,
    
    // Add timestamp columns
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at timestamp with time zone`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS packed_at timestamp with time zone`,
    `ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipped_at timestamp with time zone`,
  ];
  
  for (const stmt of alterStatements) {
    try {
      await sql.unsafe(stmt);
      console.log('✅', stmt.substring(0, 60) + '...');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('✅ (exists)', stmt.substring(0, 50) + '...');
      } else {
        console.error('❌', err.message);
      }
    }
  }
  
  // Update existing rows to have order_number if null
  console.log('🔄 Updating existing orders with order_number...');
  try {
    await sql`
      UPDATE orders 
      SET order_number = CONCAT('ORD-', TO_CHAR(created_at, 'YYYYMMDD'), '-', UPPER(SUBSTRING(id::text, 1, 5)))
      WHERE order_number IS NULL
    `;
    console.log('✅ Updated existing orders');
  } catch (err) {
    console.log('⚠️ Update error (may be ok if no rows):', err.message);
  }
  
  // Set NOT NULL constraint
  console.log('🔄 Setting order_number as NOT NULL...');
  try {
    await sql`ALTER TABLE orders ALTER COLUMN order_number SET NOT NULL`;
    console.log('✅ Set NOT NULL constraint');
  } catch (err) {
    console.log('⚠️', err.message);
  }
  
  // Add unique constraint
  console.log('🔄 Adding unique constraint on order_number...');
  try {
    await sql`ALTER TABLE orders ADD CONSTRAINT orders_order_number_unique UNIQUE (order_number)`;
    console.log('✅ Added unique constraint');
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('✅ Unique constraint already exists');
    } else {
      console.log('⚠️', err.message);
    }
  }
  
  // Add index on order_number
  console.log('🔄 Adding index on order_number...');
  try {
    await sql`CREATE INDEX IF NOT EXISTS orders_order_number_idx ON orders (order_number)`;
    console.log('✅ Added index');
  } catch (err) {
    console.log('⚠️', err.message);
  }
  
  console.log('✅ Done!');
  await sql.end();
}

addMissingColumns();
