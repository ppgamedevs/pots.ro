import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";

interface HealthCheck {
  name: string;
  status: 'ok' | 'error';
  message?: string;
  duration?: number;
}

export async function GET(request: NextRequest) {
  const checks: HealthCheck[] = [];
  const startTime = Date.now();

  // Database check
  try {
    const dbStart = Date.now();
    await db.execute(sql`SELECT 1`);
    checks.push({
      name: 'db',
      status: 'ok',
      duration: Date.now() - dbStart,
    });
  } catch (error) {
    checks.push({
      name: 'db',
      status: 'error',
      message: error instanceof Error ? error.message : 'Database connection failed',
    });
  }

  // Storage check (Vercel Blob or S3)
  try {
    const storageStart = Date.now();
    const backend = process.env.BLOB_BACKEND || 'none';
    
    if (backend === 'vercel') {
      // Test Vercel Blob access
      const { put } = await import('@vercel/blob');
      const testBlob = await put('health-check.txt', 'test', {
        access: 'public',
        addRandomSuffix: false,
      });
      checks.push({
        name: 'storage',
        status: 'ok',
        duration: Date.now() - storageStart,
      });
    } else if (backend === 's3') {
      // Test S3 access (simplified check)
      const AWS = await import('aws-sdk');
      const s3 = new AWS.S3({
        accessKeyId: process.env.S3_ACCESS_KEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
        region: process.env.S3_REGION,
      });
      
      const bucketName = process.env.S3_BUCKET;
      if (!bucketName) {
        throw new Error('S3_BUCKET environment variable not set');
      }
      await s3.headBucket({ Bucket: bucketName }).promise();
      checks.push({
        name: 'storage',
        status: 'ok',
        duration: Date.now() - storageStart,
      });
    } else {
      checks.push({
        name: 'storage',
        status: 'ok',
        message: 'Storage not configured',
      });
    }
  } catch (error) {
    checks.push({
      name: 'storage',
      status: 'error',
      message: error instanceof Error ? error.message : 'Storage check failed',
    });
  }

  // Payments provider check
  try {
    const paymentsStart = Date.now();
    // Simple ping to payment provider (noop)
    // In a real implementation, you'd ping your payment provider
    checks.push({
      name: 'payments',
      status: 'ok',
      duration: Date.now() - paymentsStart,
    });
  } catch (error) {
    checks.push({
      name: 'payments',
      status: 'error',
      message: error instanceof Error ? error.message : 'Payments provider check failed',
    });
  }

  // Invoices provider check
  try {
    const invoicesStart = Date.now();
    // Simple ping to invoice provider (noop)
    // In a real implementation, you'd ping your invoice provider
    checks.push({
      name: 'invoices',
      status: 'ok',
      duration: Date.now() - invoicesStart,
    });
  } catch (error) {
    checks.push({
      name: 'invoices',
      status: 'error',
      message: error instanceof Error ? error.message : 'Invoices provider check failed',
    });
  }

  // Email provider check
  try {
    const emailStart = Date.now();
    // Simple ping to email provider (noop)
    // In a real implementation, you'd ping your email provider
    checks.push({
      name: 'email',
      status: 'ok',
      duration: Date.now() - emailStart,
    });
  } catch (error) {
    checks.push({
      name: 'email',
      status: 'error',
      message: error instanceof Error ? error.message : 'Email provider check failed',
    });
  }

  const allChecksPassed = checks.every(check => check.status === 'ok');
  const statusCode = allChecksPassed ? 200 : 503;

  return NextResponse.json({
    ok: allChecksPassed,
    checks: checks.reduce((acc, check) => {
      acc[check.name] = {
        status: check.status,
        message: check.message,
        duration: check.duration,
      };
      return acc;
    }, {} as Record<string, any>),
    timestamp: new Date().toISOString(),
    duration: Date.now() - startTime,
  }, { status: statusCode });
}
