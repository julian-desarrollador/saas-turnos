-- Corre fuera de una transacción, con el rol dueño (DIRECT_URL).
-- CREATE ROLE no puede vivir dentro de la migración de Prisma.
-- El LOGIN y la contraseña se agregan después y no se versionan:
--   ALTER ROLE saas_app LOGIN PASSWORD '...' ;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'saas_app') THEN
    CREATE ROLE saas_app NOLOGIN NOBYPASSRLS;
  END IF;
END
$$;
