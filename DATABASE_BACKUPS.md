# Database Backup Guide

This guide covers how to set up and manage database backups for Pots.ro.

## Overview

Your database is hosted on **Vercel Postgres (Neon)**, which provides:
- ✅ Automatic daily backups (retained for 7 days)
- ✅ Point-in-time recovery (PITR) available
- ✅ Manual backup capability

## Backup Options

### Option 1: Vercel/Neon Automatic Backups (Recommended)

**Vercel Postgres automatically backs up your database daily** and retains backups for 7 days.

**Access backups:**
1. Go to Vercel Dashboard → Your Project → Storage → Postgres
2. Click on your database
3. Navigate to "Backups" tab
4. You can restore from any backup point

**Point-in-Time Recovery:**
- Available in Vercel dashboard
- Can restore to any point in the last 7 days
- Useful for recovering from accidental data loss

### Option 2: Manual Script Backups

Use the provided scripts to create manual backups:

#### Create a Backup

```bash
# Basic backup (SQL format)
npm run backup:db

# Custom backup location
npm run backup:db -- --output=backups/my-backup.sql

# Custom format (compressed, allows selective restore)
npm run backup:db -- --format=custom --output=backups/my-backup.dump
```

**Backup Formats:**
- `sql` (default) - Plain SQL text, human-readable
- `custom` - Compressed binary, allows selective restore
- `tar` - Tar archive format

#### Restore a Backup

```bash
# Restore SQL backup
npm run restore:db -- --file=backups/backup-2025-01-10.sql

# Restore custom format
npm run restore:db -- --file=backups/backup-2025-01-10.dump --format=custom

# Clean restore (drops existing objects first)
npm run restore:db -- --file=backups/backup-2025-01-10.sql --clean
```

⚠️ **Warning**: Restoring will overwrite your current database. Always backup before restoring!

### Option 3: Automated Daily Backups (Vercel Cron)

You can set up automated daily backups using Vercel Cron Jobs:

1. Create a backup API route: `app/api/cron/backup-db/route.ts`
2. Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/backup-db",
      "schedule": "0 2 * * *"
    }
  ]
}
```

This will run daily at 2 AM UTC.

## Backup Storage

### Local Backups
- Stored in `backups/` directory
- **Important**: Add `backups/` to `.gitignore` (already done)
- Don't commit backups to git (they contain sensitive data)

### Cloud Storage (Recommended for Production)

For production, store backups in cloud storage:

1. **Vercel Blob Storage** (recommended)
2. **AWS S3**
3. **Google Cloud Storage**

Update `scripts/backup-db.ts` to upload backups after creation.

## Backup Strategy

### Development
- Rely on Vercel automatic backups
- Manual backups before major changes

### Production
- ✅ Vercel automatic daily backups (7-day retention)
- ✅ Weekly manual backups to cloud storage (30-day retention)
- ✅ Monthly backups to long-term storage (1-year retention)
- ✅ Backup before major migrations or deployments

## Restore Procedure

### From Vercel Dashboard (Easiest)

1. Go to Vercel Dashboard → Storage → Postgres
2. Click on your database
3. Go to "Backups" tab
4. Select a backup point
5. Click "Restore"
6. Confirm the restore

### From Manual Backup File

1. Ensure you have a recent backup
2. Run restore command:
   ```bash
   npm run restore:db -- --file=backups/backup-YYYY-MM-DD.sql
   ```
3. Verify data integrity
4. Test application functionality

### Point-in-Time Recovery

1. Go to Vercel Dashboard → Storage → Postgres
2. Click on your database
3. Go to "Backups" tab
4. Select "Point-in-Time Recovery"
5. Choose the recovery point
6. Confirm recovery

## Testing Backups

**Always test your backup and restore procedure!**

1. Create a test backup
2. Make a small change to the database
3. Restore from backup
4. Verify the change is gone
5. Document the process

## Backup Checklist

### Before Going Live
- [ ] Test backup creation
- [ ] Test backup restoration
- [ ] Verify Vercel automatic backups are enabled
- [ ] Set up cloud storage for long-term backups
- [ ] Document restore procedure
- [ ] Train team on backup/restore process

### Regular Maintenance
- [ ] Weekly: Verify backups are being created
- [ ] Monthly: Test restore procedure
- [ ] Quarterly: Review backup retention policy
- [ ] Annually: Test disaster recovery procedure

## Troubleshooting

### Backup Fails

**Error: "pg_dump: command not found"**
- Install PostgreSQL client tools:
  - macOS: `brew install postgresql`
  - Linux: `apt-get install postgresql-client` or `yum install postgresql`
  - Windows: Download from postgresql.org

**Error: "Connection refused"**
- Check DATABASE_URL is correct
- Verify database is accessible
- Check firewall/network settings

### Restore Fails

**Error: "Database is being accessed by other users"**
- Close all connections to the database
- For Vercel Postgres, this usually resolves automatically

**Error: "Permission denied"**
- Ensure DATABASE_URL has admin privileges
- Check file permissions on backup file

## Best Practices

1. ✅ **Test regularly** - Don't wait for a disaster to test backups
2. ✅ **Multiple locations** - Store backups in multiple places
3. ✅ **Automate** - Use automated backups when possible
4. ✅ **Document** - Keep restore procedures documented
5. ✅ **Monitor** - Set up alerts for backup failures
6. ✅ **Encrypt** - Encrypt backups containing sensitive data
7. ✅ **Retention** - Follow 3-2-1 rule: 3 copies, 2 different media, 1 offsite

## 3-2-1 Backup Rule

- **3 copies** of your data
  - Production database
  - Daily backup
  - Weekly/monthly backup
  
- **2 different media**
  - Vercel Postgres (cloud)
  - Cloud storage (S3, Blob, etc.)
  
- **1 offsite**
  - Cloud storage in different region
  - Or separate cloud provider

## Support

For issues with:
- **Vercel Postgres backups**: Check Vercel documentation or support
- **Backup scripts**: Check script logs and error messages
- **Restore issues**: Verify backup file integrity and database permissions

---

**Last Updated**: 2025-01-10
