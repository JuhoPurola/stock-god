#!/bin/bash

# Database migration script
set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Default to local database if not set
DATABASE_URL=${DATABASE_URL:-postgresql://stock_picker:dev_password@localhost:5432/stock_picker}

echo "Running database migrations..."
echo "Database: $DATABASE_URL"

# Run schema
echo "Creating schema..."
psql "$DATABASE_URL" -f scripts/schema.sql

echo "Migration completed successfully!"
