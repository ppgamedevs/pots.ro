# SmartBill Setup Guide

## Status Curent - SmartBill Receipt Integration

**Data:** 2026-02-12  
**Status:** În curs de configurare

### Context Actual

- **Problema:** Crearea chitanțelor prin SmartBill API returnează eroare 500 Internal Server Error
- **Payload implementat:** Include câmpuri specifice chitanțelor (`issueDate`, `paymentDate`, `isDraft`, `paymentMethod`, `paymentRef`, `observations`)
- **Endpoint folosit:** `/invoice` (același ca pentru facturi, diferența fiind seria 'CH' vs 'PO')
- **Seria configurată:** 'CH' există și este activă în contul SmartBill
- **CUI companie:** RO43414871 (verificat că se potrivește cu contul)

### Acțiuni în Curs

**Contactare SmartBill Support pentru cont de test:**
- Se contactează suportul SmartBill pentru a obține un cont de test
- Scop: Configurarea unui mediu de testare pentru a identifica exact cerințele API-ului pentru chitanțe
- Necesar: Documentație oficială sau exemple de payload-uri pentru chitanțe

### Note Pentru Continuare

Când se revine la acest subiect:
1. Verifică dacă contul de test SmartBill a fost obținut
2. Testează crearea chitanțelor cu contul de test pentru a identifica cerințele exacte
3. Compară payload-ul pentru chitanțe cu cel pentru facturi (care funcționează)
4. Verifică dacă există endpoint-uri diferite sau câmpuri obligatorii specifice chitanțelor
5. Consultă log-urile din `.cursor/smartbill-error-*.log` pentru detalii despre payload-urile trimise

### Fișiere Relevante

- `lib/invoicing/smartbill.ts` - Implementarea SmartBill provider (metoda `_createReceiptAttempt`)
- `app/api/admin/integrations/invoicing/receipt/route.ts` - Endpoint pentru generare manuală chitanțe
- `app/api/admin/integrations/invoicing/receipt/test-minimal/route.ts` - Endpoint de test cu payload minim
- `app/api/admin/integrations/invoicing/receipt/test-payload/route.ts` - Endpoint pentru testare sistematică variații payload
- `.cursor/smartbill-error-*.log` - Log-uri detaliate cu payload-urile trimise și răspunsurile SmartBill

---

## Configurare Manuală în Contul SmartBill.ro

**IMPORTANT:** Înainte de a folosi API-ul SmartBill, trebuie să configurezi manual următoarele în contul SmartBill:

### 1. Verificare Credențiale API

- [ ] Cont SmartBill.ro creat și activ
- [ ] Mergi la **Contul meu → Integrări → API**
- [ ] Obține **Token API** (folosit în `SMARTBILL_TOKEN`)
- [ ] Verifică că **Username** (email-ul contului) este corect (folosit în `SMARTBILL_USERNAME`)

### 2. Configurare Serie Chitanță

- [ ] Mergi la **Setări → Serii Documente**
- [ ] Creează o serie pentru chitanțe (ex: `CH` sau `CHIT`)
- [ ] Asigură-te că seria există și este **activă**
- [ ] Notează numele exact al seriei (trebuie să fie identic cu `SMARTBILL_RECEIPT_SERIES` sau `SMARTBILL_SERIES`)

**Notă:** Seria trebuie să existe și să fie activă înainte de a folosi API-ul. Dacă seria nu există, vei primi eroare 500 sau 400.

### 3. Configurare Companie

- [ ] Mergi la **Setări → Date Companie**
- [ ] Verifică că **CUI-ul companiei** este corect
- [ ] Acest CUI trebuie să fie **exact identic** cu `COMPANY_VAT_NUMBER` din environment variables
- [ ] Verifică că compania este activă și validată

**Notă:** Dacă CUI-ul nu se potrivește, vei primi eroare 500 sau 400.

### 4. Testare Configurație

După configurarea manuală, testează configurația folosind endpoint-ul de test:

```bash
# Test cu seria default
POST /api/admin/integrations/invoicing/receipt/test-minimal

# Test cu o serie specifică
POST /api/admin/integrations/invoicing/receipt/test-minimal?series=CH
```

Acest endpoint va crea o chitanță de test cu payload minim pentru a verifica că toate configurațiile sunt corecte.

## Automated SmartBill Environment Variables Setup

## Quick Start

Run the automated script to add SmartBill environment variables to Vercel Production:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/add-smartbill-env-automated.ps1
```

## Prerequisites

1. **Node.js installed** (for npx)
2. **Logged in to Vercel** - Run `npx vercel login` first if not already logged in
3. **Project linked to Vercel** - The script will attempt to link automatically if needed
4. **SmartBill account configured** - Complete manual setup steps above first

## What the Script Does

1. ✅ Checks Vercel authentication
2. ✅ Links project to Vercel (if not already linked)
3. ✅ Adds all 6 SmartBill environment variables to Production:
   - `INVOICE_PROVIDER=smartbill`
   - `SMARTBILL_API_BASE=https://ws.smartbill.ro/SBORO/api`
   - `SMARTBILL_USERNAME=eugen.costachescu@yahoo.com`
   - `SMARTBILL_TOKEN=30b85d9ce1b9f12edab13fd83d448b2b`
   - `SMARTBILL_SERIES=PO`
   - `COMPANY_VAT_NUMBER=RO43414871`
4. ✅ Optionally triggers redeploy

## Manual Steps (if script doesn't work)

If the automated script fails, you can add variables manually:

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project → **Settings** → **Environment Variables**
3. Add each variable (see values in `scripts/add-smartbill-env-to-vercel.md`)
4. Select **Production** environment
5. Redeploy from **Deployments** tab

## Verification

After adding variables and redeploying:

1. Visit `https://pots.ro/admin/smartbill`
2. Login as admin
3. All SmartBill variables should show as "configured" (green checkmarks)

## Troubleshooting

### Probleme Comune

#### Eroare 500 Internal Server Error la crearea chitanțelor

**Cauze posibile:**
1. **Serie inexistentă**: Seria specificată nu există în contul SmartBill
   - **Soluție**: Mergi la Setări → Serii Documente și verifică că seria există și este activă
   - Verifică că `SMARTBILL_RECEIPT_SERIES` sau `SMARTBILL_SERIES` se potrivește exact cu numele seriei din SmartBill

2. **CUI companie nepotrivit**: CUI-ul din environment variables nu se potrivește cu cel din cont
   - **Soluție**: Verifică Setări → Date Companie în SmartBill și asigură-te că `COMPANY_VAT_NUMBER` este identic

3. **Credențiale API invalide**: Username sau token incorect
   - **Soluție**: Obține din nou token-ul din Contul meu → Integrări → API

#### Eroare 400 Bad Request

- Verifică că toate câmpurile obligatorii sunt completate corect
- Verifică formatul CUI-ului (trebuie să fie RO + cifre, ex: RO12345678)
- Verifică că moneda este 'RON' sau 'EUR'

#### Eroare 401 Unauthorized

- Verifică că `SMARTBILL_USERNAME` și `SMARTBILL_TOKEN` sunt corecte
- Verifică că token-ul nu a expirat (regenerează-l din contul SmartBill dacă e necesar)

#### Variabilele nu apar ca "configured"

- **"Not logged in"**: Run `npx vercel login` first
- **"Project not linked"**: Script will attempt to link automatically
- **Variables still show "Not configured"**: 
  - Verify variables are added to **Production** environment
  - Ensure deployment completed successfully
  - Wait a few minutes and hard refresh (Ctrl+F5)

### Testare Configurație

Folosește endpoint-ul de test pentru a verifica configurația:

```bash
curl -X POST https://pots.ro/api/admin/integrations/invoicing/receipt/test-minimal \
  -H "Cookie: your-auth-cookie" \
  -H "Content-Type: application/json"
```

Sau din interfața admin, poți accesa direct endpoint-ul pentru a vedea detaliile configurației și eventualele erori.
