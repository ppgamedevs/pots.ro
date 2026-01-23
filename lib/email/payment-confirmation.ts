import { Resend } from 'resend';
import { OrderPublic } from '@/types/checkout';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface PaymentConfirmationEmailData {
  order: OrderPublic;
  customerEmail: string;
  customerName?: string;
}

export async function sendPaymentConfirmationEmail(data: PaymentConfirmationEmailData) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('RESEND_API_KEY not set, skipping email notification');
    return;
  }

  try {
    const { order, customerEmail, customerName } = data;
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Confirmare Plată - FloristMarket.ro</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="margin: 0; font-size: 28px;">Mulțumim pentru comandă!</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">Plata a fost procesată cu succes</p>
          </div>
          
          <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none;">
            <h2 style="color: #333; margin-top: 0;">Detalii comandă</h2>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>ID Comandă:</strong> #${order.id.slice(-8)}</p>
              <p style="margin: 0 0 10px 0;"><strong>Data:</strong> ${new Date().toLocaleDateString('ro-RO')}</p>
              <p style="margin: 0 0 10px 0;"><strong>Status:</strong> <span style="color: #28a745; font-weight: bold;">Plătită</span></p>
              <p style="margin: 0;"><strong>Total:</strong> ${new Intl.NumberFormat('ro-RO', {
                style: 'currency',
                currency: 'RON',
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(order.totals.total_cents / 100)}</p>
            </div>
            
            <h3 style="color: #333; margin-top: 30px;">Produse comandate</h3>
            <div style="margin: 20px 0;">
              ${order.items.map(item => `
                <div style="display: flex; align-items: center; padding: 15px 0; border-bottom: 1px solid #e0e0e0;">
                  ${item.image_url ? `
                    <img src="${item.image_url}" alt="${item.title}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px; margin-right: 15px;">
                  ` : ''}
                  <div style="flex: 1;">
                    <h4 style="margin: 0 0 5px 0; color: #333;">${item.title}</h4>
                    <p style="margin: 0; color: #666; font-size: 14px;">Cantitate: ${item.qty}</p>
                  </div>
                  <div style="text-align: right;">
                    <p style="margin: 0; font-weight: bold; color: #333;">${new Intl.NumberFormat('ro-RO', {
                      style: 'currency',
                      currency: 'RON',
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }).format(item.subtotal_cents / 100)}</p>
                  </div>
                </div>
              `).join('')}
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Subtotal:</span>
                <span>${new Intl.NumberFormat('ro-RO', {
                  style: 'currency',
                  currency: 'RON',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(order.totals.subtotal_cents / 100)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <span>Transport:</span>
                <span>${new Intl.NumberFormat('ro-RO', {
                  style: 'currency',
                  currency: 'RON',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(order.totals.shipping_fee_cents / 100)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 18px; border-top: 2px solid #333; padding-top: 10px;">
                <span>Total:</span>
                <span>${new Intl.NumberFormat('ro-RO', {
                  style: 'currency',
                  currency: 'RON',
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(order.totals.total_cents / 100)}</span>
              </div>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.SITE_URL || 'https://floristmarket.ro'}/orders/${order.id}" 
                 style="background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                Vezi comanda completă
              </a>
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin: 0 0 10px 0; color: #1976d2;">Următorii pași</h4>
              <ul style="margin: 0; padding-left: 20px; color: #666;">
                <li>Veți primi un email de confirmare cu detaliile livrării</li>
                <li>Comanda va fi procesată în următoarele 24 de ore</li>
                <li>Veți fi notificat când comanda este expediată</li>
              </ul>
            </div>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 10px 10px; border: 1px solid #e0e0e0; border-top: none;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              Mulțumim că ați ales FloristMarket.ro!<br>
              Pentru întrebări, contactați-ne la <a href="mailto:suport@floristmarket.ro" style="color: #667eea;">suport@floristmarket.ro</a>
            </p>
          </div>
        </body>
      </html>
    `;

    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'FloristMarket.ro <no-reply@floristmarket.ro>',
      to: customerEmail,
      subject: `Confirmare plată - Comanda #${order.id.slice(-8)}`,
      html: emailHtml,
    });

    console.log('Payment confirmation email sent to:', customerEmail);
  } catch (error) {
    console.error('Error sending payment confirmation email:', error);
    throw error;
  }
}
