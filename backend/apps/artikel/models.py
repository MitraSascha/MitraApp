"""
Artikelstamm — liest aus der externen PostgreSQL-Datenbank auf Port 5433.
Kein Django-managed Model (keine Migrations für diese DB).
Nur für Raw-SQL-Zugriffe via ArtikelstammRouter.
"""
# Diese App hat kein eigenes Django-Modell, da die Artikelstamm-DB
# extern verwaltet wird (Datanorm v5 Import).
# Zugriff via psycopg2 direkt in views.py.
