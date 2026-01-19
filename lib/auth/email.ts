import { Resend } from 'resend';

// Initialize Resend lazily to avoid build-time errors
let resend: Resend | null = null;

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      // For development without API key, return a mock instance
      console.warn('RESEND_API_KEY not set - emails will be mocked in development');
      resend = new Resend('mock_key_for_development');
    } else {
      resend = new Resend(apiKey);
    }
  }
  return resend;
}

// Email configuration
const FROM_EMAIL = 'FloristMarket <noreply@floristmarket.ro>';
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://floristmarket.ro';

export interface OtpEmailData {
  email: string;
  code: string;
  magicUrl: string;
}

/**
 * Send OTP email with code and magic link
 */
export async function sendOtpEmail(data: OtpEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    const { email, code, magicUrl } = data;
    
    // Mock email sending in development without API key
    if (!process.env.RESEND_API_KEY) {
      console.log(`[MOCK EMAIL] OTP sent to ${email}: ${code}`);
      console.log(`[MOCK EMAIL] Magic link: ${magicUrl}`);
      return { success: true };
    }
    
    const htmlContent = generateOtpEmailHtml(code, magicUrl);
    const textContent = generateOtpEmailText(code, magicUrl);
    
    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Codul tău FloristMarket',
      html: htmlContent,
      text: textContent,
      headers: {
        'X-Priority': '1',
        'X-MSMail-Priority': 'High',
      },
    });
    
    if (result.error) {
      console.error('Resend error:', result.error);
      return { success: false, error: result.error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending OTP email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Generate HTML content for OTP email
 */
function generateOtpEmailHtml(code: string, magicUrl: string): string {
  return `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Codul tău FloristMarket</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1F2421;
      background-color: #F7F4F1;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    }
    .header {
      background-color: #1C6B5A;
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      color: #FFFFFF;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 32px;
    }
    .code-container {
      background-color: #F7F4F1;
      border-radius: 12px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .code {
      font-size: 32px;
      font-weight: 700;
      color: #1C6B5A;
      letter-spacing: 4px;
      margin: 0;
    }
    .code-label {
      font-size: 14px;
      color: #6B6B6B;
      margin-top: 8px;
    }
    .button-container {
      text-align: center;
      margin: 24px 0;
    }
    .button {
      display: inline-block;
      background-color: #1C6B5A;
      color: #FFFFFF !important;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 16px;
      line-height: 1.5;
      mso-padding-alt: 0;
      -webkit-text-size-adjust: none;
    }
    .button:hover {
      background-color: #155A4A !important;
    }
    /* Gmail-specific button fix */
    .button-table {
      margin: 24px auto;
      border-collapse: separate !important;
      border-radius: 12px;
      background-color: #1C6B5A;
    }
    .button-td {
      border-radius: 12px;
      background-color: #1C6B5A;
      text-align: center;
    }
    .footer {
      padding: 24px 32px;
      background-color: #F7F4F1;
      font-size: 12px;
      color: #6B6B6B;
      text-align: center;
    }
    .warning {
      background-color: #FFF3CD;
      border: 1px solid #FFEAA7;
      border-radius: 8px;
      padding: 16px;
      margin: 24px 0;
      font-size: 14px;
    }
    @media (prefers-color-scheme: dark) {
      body {
        background-color: #1F2421;
      }
      .container {
        background-color: #2D2D2D;
      }
      .content {
        color: #FFFFFF;
      }
      .code-container {
        background-color: #3D3D3D;
      }
      .footer {
        background-color: #3D3D3D;
        color: #CCCCCC;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Codul tău FloristMarket</h1>
    </div>
    
    <div class="content">
      <p>Salut!</p>
      <p>Ai solicitat să te autentifici pe FloristMarket. Iată codul tău de autentificare:</p>
      
      <div class="code-container">
        <div class="code">${code}</div>
        <div class="code-label">Valabil 10 minute</div>
      </div>
      
      <p>Introdu acest cod în aplicație sau apasă butonul de mai jos pentru a te autentifica instant:</p>
      
      <div style="text-align: center;">
        <!--[if mso]>
        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${magicUrl}" style="height:52px;v-text-anchor:middle;width:200px;" arcsize="23%" stroke="f" fillcolor="#1C6B5A">
          <w:anchorlock/>
          <center style="color:#ffffff;font-family:sans-serif;font-size:16px;font-weight:600;">Intră instant</center>
        </v:roundrect>
        <![endif]-->
        <!--[if !mso]><!-->
        <table class="button-table" role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
          <tr>
            <td class="button-td" style="border-radius:12px;background-color:#1C6B5A;">
              <a href="${magicUrl}" target="_blank" style="background-color:#1C6B5A;border-radius:12px;color:#FFFFFF;display:inline-block;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;font-weight:600;line-height:52px;text-align:center;text-decoration:none;width:200px;-webkit-text-size-adjust:none;mso-hide:all;">Intră instant</a>
            </td>
          </tr>
        </table>
        <!--<![endif]-->
      </div>
      
      <div class="warning">
        <strong>Important:</strong> Dacă nu ai solicitat tu acest cod, ignoră acest e-mail. Codul va expira în 10 minute.
      </div>
      
      <p>Dacă ai întrebări, ne poți contacta la <a href="mailto:support@floristmarket.ro">support@floristmarket.ro</a></p>
      
      <p>Cu drag,<br>Echipa FloristMarket</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} FloristMarket. Toate drepturile rezervate.</p>
      <p>Acest e-mail a fost trimis automat. Te rugăm să nu răspunzi la acest mesaj.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate text content for OTP email
 */
function generateOtpEmailText(code: string, magicUrl: string): string {
  return `
Codul tău FloristMarket

Salut!

Ai solicitat să te autentifici pe FloristMarket. Iată codul tău de autentificare:

${code}

Acest cod este valabil 10 minute.

Pentru a te autentifica instant, accesează linkul:
${magicUrl}

IMPORTANT: Dacă nu ai solicitat tu acest cod, ignoră acest e-mail. Codul va expira în 10 minute.

Dacă ai întrebări, ne poți contacta la support@floristmarket.ro

Cu drag,
Echipa FloristMarket

---
© ${new Date().getFullYear()} FloristMarket. Toate drepturile rezervate.
Acest e-mail a fost trimis automat. Te rugăm să nu răspunzi la acest mesaj.
  `;
}

/**
 * Generate magic link URL
 */
export function generateMagicLink(token: string, email: string): string {
  const params = new URLSearchParams({
    t: token,
    e: email,
  });
  
  return `${SITE_URL}/api/auth/magic?${params.toString()}`;
}

/**
 * Send welcome email (for new users)
 */
export async function sendWelcomeEmail(email: string, name?: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Mock email sending in development without API key
    if (!process.env.RESEND_API_KEY) {
      console.log(`[MOCK EMAIL] Welcome email sent to ${email}`);
      return { success: true };
    }
    
    const htmlContent = generateWelcomeEmailHtml(name);
    const textContent = generateWelcomeEmailText(name);
    
    const result = await getResend().emails.send({
      from: FROM_EMAIL,
      to: [email],
      subject: 'Bine ai venit pe FloristMarket!',
      html: htmlContent,
      text: textContent,
    });
    
    if (result.error) {
      console.error('Resend error:', result.error);
      return { success: false, error: result.error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error sending welcome email:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Generate welcome email HTML
 */
function generateWelcomeEmailHtml(name?: string): string {
  const greeting = name ? `Salut ${name}!` : 'Salut!';
  
  return `
<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bine ai venit pe FloristMarket!</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1F2421;
      background-color: #F7F4F1;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #FFFFFF;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 24px rgba(0,0,0,0.08);
    }
    .header {
      background-color: #1C6B5A;
      padding: 32px;
      text-align: center;
    }
    .header h1 {
      color: #FFFFFF;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content {
      padding: 32px;
    }
    .button {
      display: inline-block;
      background-color: #1C6B5A;
      color: #FFFFFF;
      text-decoration: none;
      padding: 16px 32px;
      border-radius: 12px;
      font-weight: 600;
      margin: 24px 0;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #155A4A;
    }
    .footer {
      padding: 24px 32px;
      background-color: #F7F4F1;
      font-size: 12px;
      color: #6B6B6B;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Bine ai venit pe FloristMarket!</h1>
    </div>
    
    <div class="content">
      <p>${greeting}</p>
      <p>Contul tău a fost creat cu succes! Acum poți:</p>
      
      <ul>
        <li>Explora produsele din marketplace</li>
        <li>Adăuga produse în coș și finaliza comenzi</li>
        <li>Deveni vânzător și începe să vinzi</li>
        <li>Accesa suportul nostru 24/7</li>
      </ul>
      
      <div style="text-align: center;">
        <a href="${SITE_URL}" class="button">Începe să explorezi</a>
      </div>
      
      <p>Dacă ai întrebări, ne poți contacta la <a href="mailto:support@floristmarket.ro">support@floristmarket.ro</a></p>
      
      <p>Cu drag,<br>Echipa FloristMarket</p>
    </div>
    
    <div class="footer">
      <p>© ${new Date().getFullYear()} FloristMarket. Toate drepturile rezervate.</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate welcome email text
 */
function generateWelcomeEmailText(name?: string): string {
  const greeting = name ? `Salut ${name}!` : 'Salut!';
  
  return `
Bine ai venit pe FloristMarket!

${greeting}

Contul tău a fost creat cu succes! Acum poți:

• Explora produsele din marketplace
• Adăuga produse în coș și finaliza comenzi  
• Deveni vânzător și începe să vinzi
• Accesa suportul nostru 24/7

Începe să explorezi: ${SITE_URL}

Dacă ai întrebări, ne poți contacta la support@floristmarket.ro

Cu drag,
Echipa FloristMarket

---
© ${new Date().getFullYear()} FloristMarket. Toate drepturile rezervate.
  `;
}
