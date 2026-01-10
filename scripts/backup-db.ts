/**
 * Database Backup Script
 * 
 * Creates a backup of the PostgreSQL database using pg_dump
 * Compatible with Vercel Postgres (Neon) and standard PostgreSQL
 * 
 * Usage:
 *   npm run backup:db
 *   npm run backup:db -- --output=backup-2025-01-10.sql
 */

import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, mkdir, readFile, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';
import { logger } from '../lib/logger';
import { put } from '@vercel/blob';

const execAsync = promisify(exec);

// Load environment variables
config({ path: '.env.local' });
config();

// Import env normalization
import '../lib/env';

interface BackupOptions {
  output?: string;
  format?: 'sql' | 'custom' | 'directory' | 'tar';
  compress?: boolean;
}

async function createBackup(options: BackupOptions = {}) {
  const dbLogger = logger.child({ component: 'backup' });
  
  try {
    const databaseUrl = process.env.DATABASE_URL || 
                       process.env.POSTGRES_URL_NON_POOLING || 
                       process.env.POSTGRES_POSTGRES_URL_NON_POOLING ||
                       process.env.POSTGRES_URL ||
                       process.env.POSTGRES_POSTGRES_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set. Cannot create backup.');
    }

    // Parse database URL
    const url = new URL(databaseUrl);
    const host = url.hostname;
    const port = url.port || '5432';
    const database = url.pathname.slice(1); // Remove leading /
    const username = url.username;
    const password = url.password;

    // Generate backup filename
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupDir = join(process.cwd(), 'backups');
    const format = options.format || 'sql';
    const outputFile = options.output || 
      join(backupDir, `backup-${timestamp}.${format === 'sql' ? 'sql' : format === 'custom' ? 'dump' : 'tar'}`);

    // Create backups directory if it doesn't exist
    if (!existsSync(backupDir)) {
      await mkdir(backupDir, { recursive: true });
      dbLogger.info('Created backups directory', { path: backupDir });
    }

    dbLogger.info('Starting database backup', {
      host,
      database,
      format,
      output: outputFile,
    });

    // Build pg_dump command
    // For Vercel Postgres/Neon, we use the connection string directly
    const env = {
      ...process.env,
      PGPASSWORD: password,
    };

    let command: string;
    
    if (format === 'custom') {
      // Custom format (compressed, allows selective restore)
      command = `pg_dump "${databaseUrl}" -F c -f "${outputFile}"`;
    } else if (format === 'tar') {
      // Tar format
      command = `pg_dump "${databaseUrl}" -F t -f "${outputFile}"`;
    } else {
      // SQL format (plain text)
      command = `pg_dump "${databaseUrl}" -F p -f "${outputFile}"`;
    }

    // Execute backup
    const { stdout, stderr } = await execAsync(command, { env });

    if (stderr && !stderr.includes('WARNING')) {
      dbLogger.warn('Backup warnings', { stderr });
    }

    const fileStats = await stat(outputFile);
    dbLogger.info('Database backup completed successfully', {
      output: outputFile,
      size: fileStats.size,
    });

    // Create backup metadata
    const metadata = {
      timestamp: new Date().toISOString(),
      database,
      host,
      format,
      file: outputFile,
      version: '1.0.0',
    };

    const metadataFile = outputFile.replace(/\.(sql|dump|tar)$/, '.metadata.json');
    await writeFile(metadataFile, JSON.stringify(metadata, null, 2));

    dbLogger.info('Backup metadata saved', { metadataFile });

    // Upload to Vercel Blob if configured
    let blobUrl: string | null = null;
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        dbLogger.info('Uploading backup to Vercel Blob', { outputFile });
        
        const backupContent = await readFile(outputFile);
        const backupFilename = outputFile.split('/').pop() || `backup-${timestamp}.sql`;
        const blobPath = `backups/${timestamp}/${backupFilename}`;
        
        const blob = await put(blobPath, backupContent, {
          access: 'public',
          addRandomSuffix: false,
        });

        blobUrl = blob.url;
        
        // Also upload metadata
        const metadataContent = await readFile(metadataFile);
        const metadataFilename = metadataFile.split('/').pop() || `backup-${timestamp}.metadata.json`;
        await put(`backups/${timestamp}/${metadataFilename}`, metadataContent, {
          access: 'public',
          addRandomSuffix: false,
        });

        dbLogger.info('Backup uploaded to Vercel Blob', { blobUrl, blobPath });
      } catch (error) {
        dbLogger.error('Failed to upload backup to Vercel Blob', error instanceof Error ? error : new Error(String(error)), {
          outputFile,
        });
        // Don't fail the backup if blob upload fails
      }
    } else {
      dbLogger.debug('BLOB_READ_WRITE_TOKEN not set, skipping cloud upload');
    }

    return {
      success: true,
      outputFile,
      metadataFile,
      metadata: {
        ...metadata,
        size: fileStats.size,
        blobUrl,
      },
      blobUrl,
    };

  } catch (error) {
    dbLogger.error('Database backup failed', error instanceof Error ? error : new Error(String(error)), {
      options,
    });
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: BackupOptions = {};

  // Parse command line arguments
  for (const arg of args) {
    if (arg.startsWith('--output=')) {
      options.output = arg.split('=')[1];
    } else if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1] as BackupOptions['format'];
    } else if (arg === '--compress') {
      options.compress = true;
    }
  }

  createBackup(options)
    .then((result) => {
      console.log('✅ Backup completed:', result.outputFile);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Backup failed:', error.message);
      process.exit(1);
    });
}

export { createBackup };
