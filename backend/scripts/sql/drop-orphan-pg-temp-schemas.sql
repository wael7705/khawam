-- Drop orphaned PostgreSQL session temp schemas (pg_temp_* / pg_toast_temp_*)
-- Safe: only namespaces with no matching live backend in pg_stat_activity.
DO $$
DECLARE
  r RECORD;
  dropped INTEGER := 0;
BEGIN
  FOR r IN
    SELECT n.nspname
    FROM pg_namespace n
    WHERE (n.nspname LIKE 'pg_temp_%' OR n.nspname LIKE 'pg_toast_temp_%')
      AND NOT EXISTS (
        SELECT 1
        FROM pg_stat_activity a
        WHERE n.nspname = 'pg_temp_' || a.pid::text
           OR n.nspname = 'pg_toast_temp_' || a.pid::text
      )
  LOOP
    EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE', r.nspname);
    dropped := dropped + 1;
  END LOOP;
  RAISE NOTICE 'Dropped % orphan temp schemas', dropped;
END $$;
