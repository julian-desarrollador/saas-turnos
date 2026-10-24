-- El tope por defecto pasa a ser el del plan Inicio (80 mensajes por mes).
-- Las filas existentes conservan su tope; open-trial lo fija según el plan.
ALTER TABLE "tenants" ALTER COLUMN "message_monthly_cap" SET DEFAULT 80;
