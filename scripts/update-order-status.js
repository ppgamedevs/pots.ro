// Script pentru actualizarea manuală a statusului comenzii
// Utilizare: node scripts/update-order-status.js <orderId> <status>
// Statusuri valide: pending, paid, packed, shipped, delivered, canceled, failed

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function updateOrderStatus(orderId, newStatus) {
  const validStatuses = ['pending', 'paid', 'packed', 'shipped', 'delivered', 'canceled', 'failed'];
  
  if (!validStatuses.includes(newStatus)) {
    console.error(`Status invalid: ${newStatus}`);
    console.log('Statusuri valide:', validStatuses.join(', '));
    process.exit(1);
  }

  const connectionString = process.env.POSTGRES_DATABASE_URL || process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL sau POSTGRES_DATABASE_URL nu este setat');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  try {
    // Verifică dacă comanda există
    const checkResult = await pool.query(
      'SELECT id, order_number, status FROM orders WHERE id = $1 OR order_number = $2',
      [orderId, orderId]
    );

    if (checkResult.rows.length === 0) {
      console.error(`Comanda ${orderId} nu a fost găsită`);
      process.exit(1);
    }

    const order = checkResult.rows[0];
    console.log(`Comandă găsită: ${order.order_number} (${order.id})`);
    console.log(`Status curent: ${order.status}`);

    // Actualizează statusul
    const updateFields = ['status = $1', 'updated_at = NOW()'];
    const values = [newStatus, order.id];
    
    if (newStatus === 'paid') {
      updateFields.push('paid_at = NOW()');
    } else if (newStatus === 'packed') {
      updateFields.push('packed_at = NOW()');
    } else if (newStatus === 'shipped') {
      updateFields.push('shipped_at = NOW()');
    }

    await pool.query(
      `UPDATE orders SET ${updateFields.join(', ')} WHERE id = $${values.length}`,
      values
    );

    console.log(`✅ Status actualizat: ${order.status} → ${newStatus}`);

  } catch (error) {
    console.error('Eroare la actualizarea statusului:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

const orderId = process.argv[2];
const newStatus = process.argv[3];

if (!orderId || !newStatus) {
  console.log('Utilizare: node scripts/update-order-status.js <orderId> <status>');
  console.log('Exemplu: node scripts/update-order-status.js ORD-20260113-E521D paid');
  console.log('Statusuri valide: pending, paid, packed, shipped, delivered, canceled, failed');
  process.exit(1);
}

updateOrderStatus(orderId, newStatus);
