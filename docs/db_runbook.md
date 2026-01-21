# DB Runbook (Migrations/Seeds)

## Prereqs
- PostgreSQL 13+
- `psql` CLI available
- Database created (example: `tarot_app`)

## Environment variables
- `DATABASE_URL` (example: `postgres://user:pass@localhost:5432/tarot_app`)

## Apply migrations
```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/migrations/001_init.sql
```

## Apply seed data
```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f db/seeds/001_master_seed.sql
```

## Verify
```bash
psql "$DATABASE_URL" -c "\dt"
psql "$DATABASE_URL" -c "SELECT key, name FROM fortune_types ORDER BY key;"
psql "$DATABASE_URL" -c "SELECT product_key, platform FROM products ORDER BY product_key;"
```

## Rollback (manual)
- This project does not include down migrations.
- For reset, drop and recreate the database:
```bash
psql "$DATABASE_URL" -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
```

## Notes
- Seeds are idempotent via `ON CONFLICT`.
- Update product keys to match App Store/Play Store IDs before production.
