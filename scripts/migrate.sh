#!/bin/bash
# Vercel production migration script

echo "🚀 Starting Vercel production migration..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push database schema
echo "🗄️ Pushing database schema..."
npx prisma db push

# Seed database (optional - run only on first deploy)
if [ "$SEED_DATABASE" = "true" ]; then
    echo "🌱 Seeding database..."
    npm run db:seed
fi

echo "✅ Migration completed successfully!"
