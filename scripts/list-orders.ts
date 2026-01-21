/**
 * List all orders in database
 */
import dotenv from "dotenv";
import { sql } from "@vercel/postgres";

// Load environment variables from .env.local
dotenv.config({ path: ".env.local" });
require("../lib/env");

async function listOrders() {
  try {
    console.log("🔍 Listăm comenzile din baza de date...\n");

    // Get all orders with their details
    const orders = await sql`
      SELECT 
        o.id,
        o.order_number,
        o.status,
        o.currency,
        o.subtotal_cents,
        o.shipping_fee_cents,
        o.total_discount_cents,
        o.total_cents,
        o.payment_ref,
        o.awb_number,
        o.delivery_status,
        o.canceled_reason,
        o.created_at,
        o.updated_at,
        o.paid_at,
        o.packed_at,
        o.shipped_at,
        o.delivered_at,
        u.email as buyer_email,
        u.name as buyer_name,
        s.brand_name as seller_name,
        s.slug as seller_slug
      FROM orders o
      LEFT JOIN users u ON o.buyer_id = u.id
      LEFT JOIN sellers s ON o.seller_id = s.id
      ORDER BY o.created_at DESC
    `;

    if (orders.rows.length === 0) {
      console.log("❌ Nu există comenzi în baza de date.");
      return;
    }

    console.log(`📦 Total comenzi: ${orders.rows.length}\n`);

    // Statistics by status
    const statusStats = await sql`
      SELECT 
        status,
        COUNT(*) as count,
        SUM(total_cents) / 100.0 as total_ron
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `;

    console.log("📊 Statistici pe status:");
    console.log("=".repeat(80));
    statusStats.rows.forEach((row: any) => {
      const status = (row.status || 'N/A').padEnd(20);
      const count = row.count.toString().padStart(4);
      const total = row.total_ron ? parseFloat(row.total_ron).toFixed(2).padStart(10) : '0.00'.padStart(10);
      console.log(`  ${status} : ${count} comenzi | Total: ${total} RON`);
    });
    console.log("=".repeat(80));
    console.log();

    // List all orders
    console.log("📋 Lista comenzilor:");
    console.log("=".repeat(100));
    
    orders.rows.forEach((row: any, index: number) => {
      const total = row.total_cents ? (row.total_cents / 100).toFixed(2) : "0.00";
      const subtotal = row.subtotal_cents ? (row.subtotal_cents / 100).toFixed(2) : "0.00";
      const shipping = row.shipping_fee_cents ? (row.shipping_fee_cents / 100).toFixed(2) : "0.00";
      const discount = row.total_discount_cents ? (row.total_discount_cents / 100).toFixed(2) : "0.00";
      const createdDate = row.created_at ? new Date(row.created_at).toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }) : "N/A";
      
      const buyerInfo = row.buyer_email || row.buyer_name || 'N/A';
      const sellerInfo = row.seller_name || 'N/A';
      
      console.log(`\n${index + 1}. ${row.order_number || 'N/A'}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   Status: ${row.status || 'N/A'}`);
      console.log(`   Cumpărător: ${buyerInfo}`);
      console.log(`   Vânzător: ${sellerInfo}`);
      console.log(`   Subtotal: ${subtotal} ${row.currency || 'RON'}`);
      console.log(`   Livrare: ${shipping} ${row.currency || 'RON'}`);
      console.log(`   Reducere: ${discount} ${row.currency || 'RON'}`);
      console.log(`   Total: ${total} ${row.currency || 'RON'}`);
      if (row.payment_ref) {
        console.log(`   Payment Ref: ${row.payment_ref}`);
      }
      if (row.awb_number) {
        console.log(`   AWB: ${row.awb_number}`);
      }
      if (row.delivery_status) {
        console.log(`   Status livrare: ${row.delivery_status}`);
      }
      if (row.canceled_reason) {
        console.log(`   Motiv anulare: ${row.canceled_reason}`);
      }
      console.log(`   Creată: ${createdDate}`);
      if (row.paid_at) {
        console.log(`   Plătită: ${new Date(row.paid_at).toLocaleDateString('ro-RO')}`);
      }
      if (row.packed_at) {
        console.log(`   Ambalată: ${new Date(row.packed_at).toLocaleDateString('ro-RO')}`);
      }
      if (row.shipped_at) {
        console.log(`   Expediată: ${new Date(row.shipped_at).toLocaleDateString('ro-RO')}`);
      }
      if (row.delivered_at) {
        console.log(`   Livrată: ${new Date(row.delivered_at).toLocaleDateString('ro-RO')}`);
      }
      console.log(`   URL: http://localhost:3000/admin/orders/${row.id}`);
    });

    console.log("\n" + "=".repeat(100));
    console.log(`\n✅ Găsite ${orders.rows.length} comenzi în total.`);

  } catch (error: any) {
    console.error("❌ Eroare la listarea comenzilor:", error.message);
    if (error.stack) {
      console.error("Stack trace:", error.stack);
    }
    process.exit(1);
  }
}

listOrders();
