import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/authz";

export const dynamic = 'force-dynamic';

/**
 * Verify SmartBill configuration for receipts
 * Checks environment variables and provides guidance on what needs to be configured
 */
export async function GET(request: NextRequest) {
  try {
    await requireRole(request, ['admin']);

    const { searchParams } = new URL(request.url);
    const seriesToCheck = searchParams.get('series') || process.env.SMARTBILL_RECEIPT_SERIES || 'CH';

    // Check environment variables
    const config = {
      smartbillUsername: {
        configured: !!process.env.SMARTBILL_USERNAME,
        value: process.env.SMARTBILL_USERNAME ? '***configured***' : 'missing',
        required: true,
        instruction: 'Obține din: Contul meu → Integrări → API în SmartBill',
      },
      smartbillToken: {
        configured: !!process.env.SMARTBILL_TOKEN,
        value: process.env.SMARTBILL_TOKEN ? '***configured***' : 'missing',
        required: true,
        instruction: 'Obține din: Contul meu → Integrări → API în SmartBill',
      },
      companyVatNumber: {
        configured: !!process.env.COMPANY_VAT_NUMBER,
        value: process.env.COMPANY_VAT_NUMBER || 'missing',
        required: true,
        instruction: `Trebuie să fie identic cu CUI-ul din SmartBill (Setări → Date Companie). Valoare actuală: ${process.env.COMPANY_VAT_NUMBER || 'missing'}`,
      },
      receiptSeries: {
        configured: !!process.env.SMARTBILL_RECEIPT_SERIES,
        value: process.env.SMARTBILL_RECEIPT_SERIES || 'CH (default)',
        required: false,
        instruction: `Seria folosită pentru chitanțe. Default: 'CH'. Verifică că seria '${seriesToCheck}' există în SmartBill (Setări → Serii Documente) și că tipul este "Chitanță"`,
      },
      invoiceSeries: {
        configured: !!process.env.SMARTBILL_SERIES,
        value: process.env.SMARTBILL_SERIES || 'PO (default)',
        required: false,
        instruction: 'Seria pentru facturi (nu este folosită pentru chitanțe)',
      },
      apiBase: {
        configured: true,
        value: process.env.SMARTBILL_API_BASE || 'https://ws.smartbill.ro/SBORO/api',
        required: false,
        instruction: 'Endpoint-ul API SmartBill',
      },
    };

    // Test API connection
    let connectionTest: {
      success: boolean;
      message: string;
      status?: number;
    } | null = null;

    if (config.smartbillUsername.configured && config.smartbillToken.configured) {
      try {
        const apiBase = config.apiBase.value;
        const username = process.env.SMARTBILL_USERNAME!;
        const token = process.env.SMARTBILL_TOKEN!;
        
        // Test connection with a simple GET request
        const response = await fetch(`${apiBase}/email?cif=${process.env.COMPANY_VAT_NUMBER || ''}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Basic ${Buffer.from(`${username}:${token}`).toString('base64')}`,
          },
        });

        connectionTest = {
          success: response.ok || response.status === 404, // 404 is OK, means auth worked
          message: response.ok 
            ? 'Conexiune SmartBill reușită'
            : response.status === 404
            ? 'Autentificare reușită (endpoint-ul poate să nu existe, dar autentificarea funcționează)'
            : `Eroare conexiune: ${response.status} ${response.statusText}`,
          status: response.status,
        };
      } catch (error) {
        connectionTest = {
          success: false,
          message: `Eroare conexiune: ${error instanceof Error ? error.message : 'Unknown error'}`,
        };
      }
    }

    // Determine overall status
    const allRequiredConfigured = 
      config.smartbillUsername.configured &&
      config.smartbillToken.configured &&
      config.companyVatNumber.configured;

    const checklist = {
      credentials: {
        status: config.smartbillUsername.configured && config.smartbillToken.configured ? 'ok' : 'missing',
        items: [
          {
            item: 'SMARTBILL_USERNAME',
            status: config.smartbillUsername.configured ? 'ok' : 'missing',
            instruction: config.smartbillUsername.instruction,
          },
          {
            item: 'SMARTBILL_TOKEN',
            status: config.smartbillToken.configured ? 'ok' : 'missing',
            instruction: config.smartbillToken.instruction,
          },
        ],
      },
      company: {
        status: config.companyVatNumber.configured ? 'ok' : 'missing',
        items: [
          {
            item: 'COMPANY_VAT_NUMBER',
            status: config.companyVatNumber.configured ? 'ok' : 'missing',
            value: config.companyVatNumber.value,
            instruction: config.companyVatNumber.instruction,
          },
        ],
      },
      series: {
        status: 'info',
        items: [
          {
            item: 'Seria pentru chitanțe',
            status: 'info',
            value: seriesToCheck,
            instruction: `Verifică manual în SmartBill că seria '${seriesToCheck}' există și este activă (Setări → Serii Documente). IMPORTANT: Tipul documentului trebuie să fie "Chitanță", nu "Factură"`,
          },
        ],
      },
    };

    return NextResponse.json({
      ok: allRequiredConfigured && connectionTest?.success,
      configuration: config,
      connectionTest,
      checklist,
      seriesToCheck,
      nextSteps: [
        allRequiredConfigured ? null : 'Configurează toate environment variables necesare',
        connectionTest?.success ? null : 'Verifică credențialele API în SmartBill',
        `Verifică că seria '${seriesToCheck}' există în SmartBill și că tipul este "Chitanță"`,
        `Verifică că CUI-ul companiei '${process.env.COMPANY_VAT_NUMBER || 'missing'}' se potrivește exact cu cel din SmartBill`,
        'Folosește endpoint-ul /api/admin/integrations/invoicing/receipt/test-minimal pentru a testa crearea unei chitanțe',
      ].filter(Boolean),
    });

  } catch (error) {
    console.error('[SmartBill Config Verify] Error:', error);
    
    return NextResponse.json({
      ok: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
