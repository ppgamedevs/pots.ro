import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sellerApplications } from '@/db/schema/core';
import { and, eq, or, ilike, gte, lte, desc, asc, count } from 'drizzle-orm';
import { requireRole } from '@/lib/authz';
import type { InferSelectModel } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    await requireRole(req, ['admin', 'support']);
    const { searchParams } = new URL(req.url);
    
    // Pagination
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20'), 100);
    const offset = (page - 1) * pageSize;
    
    // Filters
    const q = searchParams.get('q')?.trim() || '';
    const status = searchParams.get('status')?.trim() || '';
    const dateFrom = searchParams.get('dateFrom')?.trim() || '';
    const dateTo = searchParams.get('dateTo')?.trim() || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    
    // Build where conditions
    const conditions = [];
    
    // Search filter (company, CUI, email)
    if (q) {
      const searchTerm = `%${q}%`;
      conditions.push(
        or(
          ilike(sellerApplications.company, searchTerm),
          ilike(sellerApplications.cui, searchTerm),
          ilike(sellerApplications.email, searchTerm)
        )!
      );
    }
    
    // Status filter
    if (status && status !== 'all') {
      conditions.push(eq(sellerApplications.status, status as any));
    }
    
    // Date range filter
    if (dateFrom) {
      const fromDate = new Date(dateFrom);
      fromDate.setHours(0, 0, 0, 0);
      conditions.push(gte(sellerApplications.createdAt, fromDate));
    }
    if (dateTo) {
      const toDate = new Date(dateTo);
      toDate.setHours(23, 59, 59, 999);
      conditions.push(lte(sellerApplications.createdAt, toDate));
    }
    
    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    
    // Build order by
    let orderByClause;
    if (sortBy === 'company') {
      orderByClause = sortOrder === 'asc' ? asc(sellerApplications.company) : desc(sellerApplications.company);
    } else if (sortBy === 'email') {
      orderByClause = sortOrder === 'asc' ? asc(sellerApplications.email) : desc(sellerApplications.email);
    } else if (sortBy === 'status') {
      orderByClause = sortOrder === 'asc' ? asc(sellerApplications.status) : desc(sellerApplications.status);
    } else {
      // Default: created_at
      orderByClause = sortOrder === 'asc' ? asc(sellerApplications.createdAt) : desc(sellerApplications.createdAt);
    }
    
    // Get total count
    const [totalResult] = await db
      .select({ count: count() })
      .from(sellerApplications)
      .where(whereClause);
    
    const totalItems = totalResult?.count || 0;
    const totalPages = Math.ceil(totalItems / pageSize);
    
    // Get items
    const items = await db
      .select()
      .from(sellerApplications)
      .where(whereClause)
      .orderBy(orderByClause)
      .limit(pageSize)
      .offset(offset);
    
    type ItemType = typeof items[0];
    const itemsWithFormattedDate = items.map((item: ItemType) => ({
      ...item,
      createdAt: item.createdAt?.toISOString() || null,
    }));
    
    return NextResponse.json({
      items: itemsWithFormattedDate,
      meta: {
        totalItems,
        totalPages,
        page,
        pageSize,
      },
    });
  } catch (error) {
    console.error('List applications error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}


