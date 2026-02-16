#!/bin/bash

# Database seed script
set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Default to local database if not set
DATABASE_URL=${DATABASE_URL:-postgresql://stock_picker:dev_password@localhost:5432/stock_picker}

echo "Seeding database..."
echo "Database: $DATABASE_URL"

# Run seed
echo "Inserting sample data..."
psql "$DATABASE_URL" -f scripts/seed.sql

echo "Seeding completed successfully!"
