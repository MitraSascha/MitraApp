#!/bin/bash
set -e

echo "=== MitraApp Django Startup ==="

# Warte auf PostgreSQL
echo "Warte auf PostgreSQL..."
until python -c "
import psycopg2, os, sys
try:
    psycopg2.connect(
        host=os.getenv('DB_HOST','postgres'),
        port=os.getenv('DB_PORT','5432'),
        dbname=os.getenv('DB_NAME','mitra'),
        user=os.getenv('DB_USER','mitra'),
        password=os.getenv('DB_PASSWORD','mitra2024'),
    )
    sys.exit(0)
except Exception:
    sys.exit(1)
" 2>/dev/null; do
    echo "  PostgreSQL noch nicht bereit, warte 2s..."
    sleep 2
done
echo "PostgreSQL bereit."

# Migrations pro App erstellen
echo "Erstelle Migrations..."
python manage.py makemigrations notizen --noinput 2>&1 || true
python manage.py makemigrations termine --noinput 2>&1 || true
python manage.py makemigrations kontakte --noinput 2>&1 || true
python manage.py makemigrations angebote --noinput 2>&1 || true
python manage.py makemigrations push --noinput 2>&1 || true

echo "Führe Migrations durch..."
python manage.py migrate --noinput

echo "=== Django startet ==="
exec "$@"
