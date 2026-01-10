/**
 * Database Restore Script
 * 
 * Restores a database backup created with backup-db.ts
 * 
 * Usage:
 *   npm run restore:db -- --file=backups/backup-2025-01-10.sql
 *   npm run restore:db -- --file=backups/backup-2025-01-10.dump --format=custom
 */

import { config } from 'dotenv';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, access } from 'fs/promises';
import { constants } from 'fs';
import { join } from 'path';
import { logger } from '../lib/logger';

const execAsync = promisify(exec);

// Load environment variables
config({ path: '.env.local' });
config();

// Import env normalization
import '../lib/env';

interface RestoreOptions {
  file: string;
  format?: 'sql' | 'custom' | 'tar';
  clean?: boolean; // Drop existing objects before restore
}

async function restoreBackup(options: RestoreOptions) {
  const dbLogger = logger.child({ component: 'restore' });

  if (!options.file) {
    throw new Error('Backup file is required. Use --file=path/to/backup.sql');
  }

  try {
    // Check if backup file exists
    await access(options.file, constants.F_OK);
    
    const databaseUrl = process.env.DATABASE_URL || 
                       process.env.POSTGRES_URL_NON_POOLING || 
                       process.env.POSTGRES_POSTGRES_URL_NON_POOLING ||
                       process.env.POSTGRES_URL ||
                       process.env.POSTGRES_POSTGRES_URL;

    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not set. Cannot restore backup.');
    }

    // Parse database URL
    const url = new URL(databaseUrl);
    const database = url.pathname.slice(1);
    const password = url.password;

    // Detect format from file extension if not specified
    let format = options.format;
    if (!format) {
      if (options.file.endsWith('.dump') || options.file.endsWith('.custom')) {
        format = 'custom';
      } else if (options.file.endsWith('.tar')) {
        format = 'tar';
      } else {
        format = 'sql';
      }
    }

    dbLogger.info('Starting database restore', {
      file: options.file,
      database,
      format,
      clean: options.clean,
    });

    // Build restore command
    const env = {
      ...process.env,
      PGPASSWORD: password,
    };

    let command: string;

    if (format === 'custom') {
      // Custom format restore
      command = `pg_restore "${databaseUrl}" "${options.file}"`;
      if (options.clean) {
        command += ' --clean --if-exists';
      }
    } else if (format === 'tar') {
      // Tar format restore
      command = `pg_restore "${databaseUrl}" "${options.file}"`;
      if (options.clean) {
        command += ' --clean --if-exists';
      }
    } else {
      // SQL format restore (plain text)
      command = `psql "${databaseUrl}" -f "${options.file}"`;
      if (options.clean) {
        dbLogger.warn('--clean option not supported for SQL format. Use custom format for clean restore.');
      }
    }

    // Execute restore
    const { stdout, stderr } = await execAsync(command, { env });

    if (stderr && !stderr.includes('WARNING')) {
      dbLogger.warn('Restore warnings', { stderr });
    }

    dbLogger.info('Database restore completed successfully', {
      file: options.file,
    });

    return {
      success: true,
      file: options.file,
    };

  } catch (error) {
    dbLogger.error('Database restore failed', error instanceof Error ? error : new Error(String(error)), {
      options,
    });
    throw error;
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  const options: RestoreOptions = {
    file: '',
  };

  // Parse command line arguments
  for (const arg of args) {
    if (arg.startsWith('--file=')) {
      options.file = arg.split('=')[1];
    } else if (arg.startsWith('--format=')) {
      options.format = arg.split('=')[1] as RestoreOptions['format'];
    } else if (arg === '--clean') {
      options.clean = true;
    }
  }

  if (!options.file) {
    console.error('❌ Error: --file is required');
    console.log('Usage: npm run restore:db -- --file=backups/backup-2025-01-10.sql');
    process.exit(1);
  }

  restoreBackup(options)
    .then((result) => {
      console.log('✅ Restore completed:', result.file);
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Restore failed:', error.message);
      process.exit(1);
    });
}

export { restoreBackup };
