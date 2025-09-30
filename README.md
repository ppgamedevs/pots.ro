# Pots.ro - E-commerce Platform

A modern e-commerce platform built with Next.js 14, Vercel Postgres (Neon), Drizzle ORM, Lucia Auth, and Vercel Blob.

## Tech Stack

- **Frontend/Backend**: Next.js 14 (App Router)
- **Database**: Vercel Postgres (Neon)
- **ORM**: Drizzle ORM
- **Authentication**: Lucia Auth (email/password)
- **File Storage**: Vercel Blob
- **Deployment**: Vercel

## Features

- User authentication with role-based access (buyer/seller/admin)
- Product management with draft/active/archived status
- Category hierarchy
- Full-text search with PostgreSQL
- Image upload with Vercel Blob
- Seller profiles and pages
- Public and private APIs with proper access control

## Quick Start

### 1. Environment Setup

Create a `.env.local` file with:

```env
DATABASE_URL=your_vercel_postgres_url
LUCIA_SECRET=your_secret_key
SITE_URL=http://localhost:3000
NODE_ENV=development
```

### 2. Database Setup

```bash
# Install dependencies
npm install

# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Seed categories
npm run seed
```

### 3. Development

```bash
npm run dev
```

## API Endpoints

### Public APIs
- `GET /api/categories` - List all categories
- `GET /api/products/[slug]` - Get product by slug (active only for anonymous users)
- `GET /api/sellers/[slug]` - Get seller profile
- `GET /api/search?q=...` - Search products, categories, and sellers

### Authentication Required
- `POST /api/sellers` - Create seller profile
- `POST /api/products` - Create product (seller/admin only)
- `PATCH /api/products/[id]` - Update product (owner/admin only)
- `POST /api/product-images` - Add product image (owner/admin only)
- `POST /api/upload/prepare` - Get signed upload URL (seller/admin only)

## Database Schema

### Core Tables
- `users` - User accounts with roles
- `sellers` - Seller profiles linked to users
- `categories` - Hierarchical product categories
- `products` - Product catalog with status management
- `product_images` - Product image gallery
- `seller_pages` - Custom seller pages
- `sessions` - Lucia auth sessions

### Key Features
- Full-text search with PostgreSQL tsvector
- Automatic updated_at triggers
- Proper foreign key constraints
- Optimized indexes for performance

## Deployment

### Vercel Setup

1. **Create Vercel Postgres Database**
   - Go to Vercel dashboard
   - Create a new Postgres database
   - Copy the connection string

2. **Set Environment Variables**
   ```
   DATABASE_URL=your_postgres_url
   LUCIA_SECRET=generate_random_secret
   SITE_URL=https://your-domain.vercel.app
   NODE_ENV=production
   ```

3. **Deploy**
   ```bash
   vercel --prod
   ```

4. **Run Migrations**
   ```bash
   npm run db:migrate
   npm run seed
   ```

## Acceptance Tests

Run these commands to verify the system works correctly:

```bash
# 1. Migrations run without errors
npm run db:migrate

# 2. Seed inserts 12 categories
npm run seed

# 3. Test anonymous product access
curl "http://localhost:3000/api/products/some-active-product-slug"
# Should return 200 for active products, 404 for drafts

# 4. Test authenticated seller access to own drafts
# (Requires authentication setup)

# 5. Test upload prepare with seller validation
# (Requires authentication setup)

# 6. Test product image creation with ownership validation
# (Requires authentication setup)
```

## Development Notes

- All API responses follow consistent error format: `{ error: "message" }`
- Authentication uses Lucia with session cookies
- File uploads are validated for seller ownership
- Full-text search uses PostgreSQL's built-in capabilities
- All mutations respect user permissions and ownership

## File Structure

```
├── app/api/           # API routes
├── auth/              # Lucia authentication
├── db/                # Database schema and connection
├── lib/                # Utilities and helpers
├── scripts/            # Database seeding
└── drizzle/            # Generated migrations
```
