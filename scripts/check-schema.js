require('dotenv').config({path:'.env.local'});
const postgres = require('postgres');

async function checkSchema() {
  const sql = postgres(process.env.POSTGRES_DATABASE_URL);
  
  try {
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders' 
      ORDER BY ordinal_position
    `;
    
    console.log('Orders table columns:');
    columns.forEach(c => console.log('  -', c.column_name, ':', c.data_type));
    
    if (columns.length === 0) {
      console.log('  No columns found - table may not exist');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
  
  await sql.end();
}

checkSchema();
