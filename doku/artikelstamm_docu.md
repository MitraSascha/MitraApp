Verbindung:
  ┌───────────┬──────────────────┐
  │ Parameter │       Wert       │
  ├───────────┼──────────────────┤
  │ Host      │ 85.215.195.50    │
  ├───────────┼──────────────────┤
  │ Port      │ 5433             │
  ├───────────┼──────────────────┤
  │ Datenbank │ artikelstamm     │
  ├───────────┼──────────────────┤
  │ User      │ artikelstamm     │
  ├───────────┼──────────────────┤
  │ Passwort  │ artikelstamm2024 │
  └───────────┴──────────────────┘

 Per Terminal (psql):
  psql -h 85.215.195.50 -p 5433 -U artikelstamm -d artikelstamm

  Connection String (für Python/Tools):
  postgresql://artikelstamm:artikelstamm2024@85.215.195.50:5433/artikelstamm

  In Python (psycopg2):
  import psycopg2
  conn = psycopg2.connect(
      host="localhost",
      port=5433,
      dbname="artikelstamm",
      user="artikelstamm",
      password="artikelstamm2024"
  )