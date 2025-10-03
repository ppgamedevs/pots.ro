# Disaster Rollback Plan - Pots.ro

## Overview
Plan de rollback complet pentru Pots.ro în caz de probleme majore post-lansare.

## Backup Status
- **Database**: Backup zilnic automat în Supabase
- **Storage**: Backup zilnic automat în Supabase
- **Code**: Git repository cu tag-uri de release
- **Environment**: Variabile de mediu documentate

## Rollback Scenarios

### 1. Database Corruption/Data Loss
**Symptom**: Date corupte, pierdere de informații
**Action**:
1. Accesează Supabase Dashboard
2. Navighează la Settings → Database
3. Selectează backup-ul din ziua anterioară
4. Restore database
5. Verifică integritatea datelor
6. Testează funcționalitățile critice

### 2. Payment Gateway Issues
**Symptom**: Probleme cu Netopia, plăți blocate
**Action**:
1. Schimbă `NETOPIA_MERCHANT_ID` la valoarea de backup
2. Schimbă `NETOPIA_PRIVATE_KEY` la valoarea de backup
3. Testează o tranzacție sandbox
4. Monitorizează webhook-urile
5. Notifică echipa Netopia

### 3. Email Service Failure
**Symptom**: Emailuri nu se trimit
**Action**:
1. Schimbă `RESEND_API_KEY` la valoarea de backup
2. Schimbă `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`
3. Testează trimiterea unui email
4. Verifică queue-ul de emailuri

### 4. Storage Issues
**Symptom**: Imagini nu se încarcă/afișează
**Action**:
1. Accesează Supabase Storage
2. Verifică bucket-urile
3. Restore din backup dacă e necesar
4. Verifică `SUPABASE_STORAGE_BUCKET`
5. Testează upload-ul unei imagini

### 5. Performance Issues
**Symptom**: Site lent, timeout-uri
**Action**:
1. Verifică Vercel logs
2. Verifică database performance
3. Scale up database dacă e necesar
4. Verifică cron jobs
5. Monitorizează memory usage

### 6. Security Breach
**Symptom**: Acces neautorizat, date compromise
**Action**:
1. **IMMEDIAT**: Schimbă toate parolele
2. Revoke toate token-urile JWT
3. Verifică logs de acces
4. Analizează impactul
5. Notifică utilizatorii afectați
6. Documentează incidentul

## Rollback Steps

### Step 1: Assessment
- [ ] Identifică problema
- [ ] Evaluează impactul
- [ ] Decide dacă rollback-ul e necesar
- [ ] Notifică echipa

### Step 2: Preparation
- [ ] Backup current state
- [ ] Documentează schimbările
- [ ] Pregătește environment-ul de rollback
- [ ] Testează planul de rollback

### Step 3: Execution
- [ ] Stop traffic (dacă e necesar)
- [ ] Execute rollback
- [ ] Verifică funcționalitățile
- [ ] Testează scenarii critice

### Step 4: Validation
- [ ] Testează plăți
- [ ] Testează upload imagini
- [ ] Testează emailuri
- [ ] Verifică performance
- [ ] Monitorizează logs

### Step 5: Communication
- [ ] Notifică utilizatorii
- [ ] Update status page
- [ ] Documentează incidentul
- [ ] Planifică follow-up

## Environment Variables Backup

### Production
```bash
# Database
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Payments
NETOPIA_MERCHANT_ID=...
NETOPIA_PRIVATE_KEY=...
NETOPIA_SANDBOX=true

# Email
RESEND_API_KEY=...
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASS=...

# Storage
SUPABASE_STORAGE_BUCKET=products

# Security
JWT_SECRET=...
NEXTAUTH_SECRET=...
NEXTAUTH_URL=https://pots.ro

# Analytics
GOOGLE_ANALYTICS_ID=...
```

### Backup Values
```bash
# Backup payment gateway
NETOPIA_MERCHANT_ID_BACKUP=...
NETOPIA_PRIVATE_KEY_BACKUP=...

# Backup email service
RESEND_API_KEY_BACKUP=...
SMTP_BACKUP_HOST=...
SMTP_BACKUP_USER=...
SMTP_BACKUP_PASS=...
```

## Contact Information
- **Tech Lead**: [Contact]
- **DevOps**: [Contact]
- **Netopia Support**: [Contact]
- **Supabase Support**: [Contact]
- **Vercel Support**: [Contact]

## Recovery Time Objectives (RTO)
- **Critical**: 15 minutes
- **Important**: 1 hour
- **Normal**: 4 hours

## Recovery Point Objectives (RPO)
- **Database**: 24 hours
- **Storage**: 24 hours
- **Code**: 0 (Git)
- **Configuration**: 0 (documented)

## Testing Schedule
- **Monthly**: Test rollback procedures
- **Quarterly**: Full disaster recovery test
- **After major releases**: Verify backup integrity

## Post-Incident Actions
1. **Root Cause Analysis**: Identifică cauza
2. **Prevention**: Implementează măsuri preventive
3. **Documentation**: Update planul de rollback
4. **Training**: Antrenează echipa
5. **Monitoring**: Îmbunătățește monitorizarea

## Emergency Contacts
- **24/7 Hotline**: [Phone]
- **Slack Channel**: #pots-emergency
- **Email**: emergency@pots.ro

---
**Last Updated**: 2025-01-10
**Next Review**: 2025-02-10
**Version**: 1.0
