import { NextRequest, NextResponse } from 'next/server';
import { createBackup } from '@/scripts/backup-db';
import { logger } from '@/lib/logger';

/**
 * Automated Database Backup Cron Job
 * 
 * Runs daily via Vercel Cron to create database backups
 * Configure in vercel.json:
 * {
 *   "crons": [{
 *     "path": "/api/cron/backup-db",
 *     "schedule": "0 2 * * *"
 *   }]
 * }
 */
export async function GET(request: NextRequest) {
  const cronSecret = request.headers.get('authorization');
  
  // Verify cron secret (set in Vercel environment variables)
  if (process.env.CRON_SECRET && cronSecret !== `Bearer ${process.env.CRON_SECRET}`) {
    logger.warn('Unauthorized backup cron attempt', {
      component: 'cron',
      endpoint: '/api/cron/backup-db',
      ip: request.headers.get('x-forwarded-for'),
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    logger.info('Starting automated database backup', {
      component: 'cron',
      endpoint: '/api/cron/backup-db',
    });

    const result = await createBackup({
      format: 'custom', // Use custom format for compression
    });

    logger.info('Automated database backup completed', {
      component: 'cron',
      outputFile: result.outputFile,
      blobUrl: result.blobUrl,
    });

    return NextResponse.json({
      success: true,
      message: 'Backup completed successfully',
      outputFile: result.outputFile,
      blobUrl: result.blobUrl,
      timestamp: result.metadata.timestamp,
      size: result.metadata.size,
    });

  } catch (error) {
    logger.error('Automated database backup failed', error instanceof Error ? error : new Error(String(error)), {
      component: 'cron',
      endpoint: '/api/cron/backup-db',
    });

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
