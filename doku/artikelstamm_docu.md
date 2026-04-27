Verbindung:
  ┌───────────┬──────────────────┐
  │ Parameter │       Wert       │
  ├───────────┼──────────────────┤
  │ Host      │ localhost        │
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
  docker exec -it artikelstamm_db psql -U artikelstamm -d artikelstamm

  Connection String (für Python/Tools):
  postgresql://artikelstamm:artikelstamm2024@localhost:5433/artikelstamm

  In Python (psycopg2):
  import psycopg2
  conn = psycopg2.connect(
      host="localhost",
      port=5433,
      dbname="artikelstamm",
      user="artikelstamm",
      password="artikelstamm2024"
  )