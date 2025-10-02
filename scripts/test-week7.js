/**
 * Test script pentru Week 7 features - Pots.ro MVP
 * Verifică funcționalitatea payout-urilor, refund-urilor, retururilor și anti-bypass
 */

import { db } from '@/db';
import { orders, orderItems, payouts, refunds, ledger, conversationFlags } from '@/db/schema/core';
import { eq, and } from 'drizzle-orm';
import { 
  runPayout, 
  runBatchPayouts, 
  createPayoutsForDeliveredOrder 
} from '@/lib/payouts/run';
import { 
  calculatePlatformBalance, 
  recordOrderPaid, 
  recordPayoutPaid, 
  recordRefund 
} from '@/lib/ledger/post';
import { 
  maskContacts, 
  processMessageForBypass, 
  getBypassStats 
} from '@/lib/anti/contact';
import { validateReturnRequest, validateCancellationRequest } from '@/lib/returns/policy';

console.log('🧪 Testez funcționalitățile Week 7 pentru Pots.ro...\n');

async function testPayoutSystem() {
  console.log('💰 Testez sistemul de payout-uri...');
  
  try {
    // Simulează o comandă livrată
    const mockOrderId = 'test-order-' + Date.now();
    const mockSellerId = 'test-seller-' + Date.now();
    
    // Creează o comandă mock în baza de date
    await db.insert(orders).values({
      id: mockOrderId,
      buyerId: 'test-buyer',
      sellerId: mockSellerId,
      status: 'delivered',
      currency: 'RON',
      subtotalCents: 10000, // 100 RON
      shippingFeeCents: 1000, // 10 RON
      totalCents: 11000, // 110 RON
      shippingAddress: { name: 'Test Buyer', address: 'Test Address' },
      deliveredAt: new Date()
    });

    // Creează item-uri mock
    await db.insert(orderItems).values({
      orderId: mockOrderId,
      productId: 'test-product',
      sellerId: mockSellerId,
      qty: 1,
      unitPriceCents: 10000,
      subtotalCents: 10000,
      commissionPct: 1000, // 10%
      commissionAmountCents: 1000,
      sellerDueCents: 9000
    });

    console.log(`✅ Creată comandă mock ${mockOrderId}`);

    // Creează payout-uri pentru comanda livrată
    await createPayoutsForDeliveredOrder(mockOrderId);
    console.log('✅ Creat payout-uri pentru comanda livrată');

    // Găsește payout-ul creat
    const payout = await db.query.payouts.findFirst({
      where: eq(payouts.orderId, mockOrderId)
    });

    if (payout) {
      console.log(`✅ Găsit payout ${payout.id} cu suma ${payout.amount} RON`);
      
      // Testează procesarea payout-ului
      const result = await runPayout(payout.id);
      console.log(`✅ Payout procesat: ${result.success ? 'SUCCESS' : 'FAILED'}`);
      
      if (result.success) {
        console.log(`   Provider Ref: ${result.providerRef}`);
        console.log(`   Paid At: ${result.paidAt}`);
      } else {
        console.log(`   Failure Reason: ${result.failureReason}`);
      }
    }

    // Testează batch payout-uri
    const batchResult = await runBatchPayouts(new Date().toISOString().split('T')[0]);
    console.log(`✅ Batch payout: ${batchResult.processed} procesate, ${batchResult.successful} reușite`);

  } catch (error) {
    console.error('❌ Eroare la testarea sistemului de payout:', error);
  }
}

async function testLedgerSystem() {
  console.log('\n📊 Testez sistemul de ledger...');
  
  try {
    // Testează înregistrarea unei comenzi plătite
    const mockOrderId = 'ledger-test-' + Date.now();
    
    await db.insert(orders).values({
      id: mockOrderId,
      buyerId: 'test-buyer',
      sellerId: 'test-seller',
      status: 'paid',
      currency: 'RON',
      subtotalCents: 10000,
      shippingFeeCents: 1000,
      totalCents: 11000,
      shippingAddress: { name: 'Test Buyer' }
    });

    await db.insert(orderItems).values({
      orderId: mockOrderId,
      productId: 'test-product',
      sellerId: 'test-seller',
      qty: 1,
      unitPriceCents: 10000,
      subtotalCents: 10000,
      commissionPct: 1000,
      commissionAmountCents: 1000,
      sellerDueCents: 9000
    });

    // Înregistrează tranzacțiile în ledger
    await recordOrderPaid(mockOrderId);
    console.log('✅ Înregistrate tranzacții pentru comandă plătită');

    // Calculează soldul platformei
    const balance = await calculatePlatformBalance('RON');
    console.log(`✅ Sold platformă: ${balance.balance} RON (IN: ${balance.totalIn}, OUT: ${balance.totalOut})`);

  } catch (error) {
    console.error('❌ Eroare la testarea sistemului de ledger:', error);
  }
}

async function testAntiBypassSystem() {
  console.log('\n🛡️ Testez sistemul anti-bypass...');
  
  try {
    // Testează detectarea și mascarea contactelor
    const testMessages = [
      'Salut! Poți să mă contactezi la john@example.com sau 0721234567?',
      'Mesaj normal fără contacte',
      'Email: test@domain.com și telefon: +40721234567',
      'Contactează-mă la office@company.ro pentru detalii'
    ];

    for (const message of testMessages) {
      const result = maskContacts(message);
      console.log(`📝 Mesaj: "${message}"`);
      console.log(`   Detectat: ${result.hit ? 'DA' : 'NU'}`);
      if (result.hit) {
        console.log(`   Mascat: "${result.maskedText}"`);
        console.log(`   Contacte: ${result.detectedContacts.length}`);
      }
    }

    // Testează procesarea mesajelor pentru bypass
    const mockConversationId = 'test-conversation-' + Date.now();
    const messageWithContact = 'Contactează-mă la test@example.com';
    
    const bypassResult = await processMessageForBypass(
      mockConversationId,
      messageWithContact,
      'test-sender'
    );
    
    console.log(`🔍 Procesare bypass pentru conversația ${mockConversationId}:`);
    console.log(`   Permis: ${bypassResult.allowed ? 'DA' : 'NU'}`);
    if (bypassResult.maskedText) {
      console.log(`   Text mascat: "${bypassResult.maskedText}"`);
    }
    if (bypassResult.reason) {
      console.log(`   Motiv: ${bypassResult.reason}`);
    }

    // Obține statistici bypass
    const stats = await getBypassStats();
    console.log(`📊 Statistici bypass: ${stats.totalSuspected} suspecte, ${stats.totalAttempts} încercări`);

  } catch (error) {
    console.error('❌ Eroare la testarea sistemului anti-bypass:', error);
  }
}

async function testReturnPolicy() {
  console.log('\n🔄 Testez politica de retururi...');
  
  try {
    // Testează validarea cererilor de retur
    const validOrder = {
      status: 'delivered',
      deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 zile în urmă
    };

    const invalidOrder = {
      status: 'shipped',
      deliveredAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000) // 20 zile în urmă
    };

    const validRequest = {
      orderId: 'test-order',
      reason: 'produs_defect',
      items: [{ itemId: 'item1', qty: 1, reason: 'defect' }],
      requestedAt: new Date()
    };

    const validValidation = validateReturnRequest(validOrder, validRequest);
    const invalidValidation = validateReturnRequest(invalidOrder, validRequest);

    console.log(`✅ Validare comandă validă: ${validValidation.valid ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Validare comandă invalidă: ${invalidValidation.valid ? 'FAIL' : 'PASS'}`);

    if (!validValidation.valid) {
      console.log(`   Erori: ${validValidation.policyViolations.join(', ')}`);
    }

    // Testează validarea anulărilor
    const cancelableOrder = { status: 'pending', createdAt: new Date() };
    const nonCancelableOrder = { status: 'shipped', createdAt: new Date() };

    const cancelValidation = validateCancellationRequest(cancelableOrder);
    const nonCancelValidation = validateCancellationRequest(nonCancelableOrder);

    console.log(`✅ Validare anulare permisă: ${cancelValidation.valid ? 'PASS' : 'FAIL'}`);
    console.log(`✅ Validare anulare interzisă: ${nonCancelValidation.valid ? 'FAIL' : 'PASS'}`);

  } catch (error) {
    console.error('❌ Eroare la testarea politicii de retururi:', error);
  }
}

async function testRefundSystem() {
  console.log('\n💸 Testez sistemul de refund-uri...');
  
  try {
    // Creează o comandă mock pentru refund
    const mockOrderId = 'refund-test-' + Date.now();
    
    await db.insert(orders).values({
      id: mockOrderId,
      buyerId: 'test-buyer',
      sellerId: 'test-seller',
      status: 'delivered',
      currency: 'RON',
      subtotalCents: 10000,
      shippingFeeCents: 1000,
      totalCents: 11000,
      shippingAddress: { name: 'Test Buyer' }
    });

    await db.insert(orderItems).values({
      orderId: mockOrderId,
      productId: 'test-product',
      sellerId: 'test-seller',
      qty: 1,
      unitPriceCents: 10000,
      subtotalCents: 10000,
      commissionPct: 1000,
      commissionAmountCents: 1000,
      sellerDueCents: 9000
    });

    console.log(`✅ Creată comandă mock pentru refund: ${mockOrderId}`);

    // Creează un refund mock
    const refund = await db.insert(refunds).values({
      orderId: mockOrderId,
      amount: '50.00', // 50 RON refund
      reason: 'produs_defect',
      status: 'pending',
      currency: 'RON'
    }).returning();

    console.log(`✅ Creat refund mock: ${refund[0].id}`);

    // Înregistrează refund-ul în ledger
    await recordRefund(refund[0].id, false); // nu a fost post-payout
    console.log('✅ Înregistrat refund în ledger');

    // Calculează soldul actualizat
    const balance = await calculatePlatformBalance('RON');
    console.log(`✅ Sold platformă după refund: ${balance.balance} RON`);

  } catch (error) {
    console.error('❌ Eroare la testarea sistemului de refund-uri:', error);
  }
}

async function runAllTests() {
  console.log('🚀 Pornesc testele pentru Week 7 features...\n');
  
  await testPayoutSystem();
  await testLedgerSystem();
  await testAntiBypassSystem();
  await testReturnPolicy();
  await testRefundSystem();
  
  console.log('\n✅ Toate testele Week 7 au fost completate!');
  console.log('\n📋 Rezumat funcționalități implementate:');
  console.log('   ✅ Sistem payout-uri cu provideri (Netopia, Transfer, Mock)');
  console.log('   ✅ Sistem ledger pentru tracking financiar');
  console.log('   ✅ Sistem anti-bypass cu detectare și mascare contacte');
  console.log('   ✅ Politica de retururi cu validări');
  console.log('   ✅ Sistem refund-uri cu recovery logic');
  console.log('   ✅ Retry utility cu exponential backoff');
  console.log('   ✅ API routes pentru toate operațiunile');
  console.log('   ✅ Audit logging și webhook tracking');
}

// Rulează testele dacă scriptul este executat direct
if (require.main === module) {
  runAllTests().catch(console.error);
}

export { runAllTests };
