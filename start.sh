#!/bin/bash
# MitraApp Dev-Stack starten
# Immer mit --build: Docker cached automatisch, baut nur neu wenn sich was geändert hat

set -e

if [ ! -f backend/.env ]; then
    echo "FEHLER: backend/.env fehlt!"
    echo "  -> cp backend/.env.example backend/.env"
    echo "  -> dann Credentials eintragen"
    exit 1
fi

echo "=== MitraApp startet ==="
docker compose -f docker-compose.dev.yml up --build "$@"
