-- One-time cleanup: legacy AI/chatbot schemas on shared Postgres (khawam uses public only).
-- Run only after confirming chatBot AI features on this DB are no longer required.
DROP SCHEMA IF EXISTS ai_core CASCADE;
DROP SCHEMA IF EXISTS ai_os CASCADE;
DROP SCHEMA IF EXISTS catalog CASCADE;
DROP SCHEMA IF EXISTS customer CASCADE;
DROP SCHEMA IF EXISTS knowledge CASCADE;
DROP SCHEMA IF EXISTS operations CASCADE;
DROP SCHEMA IF EXISTS promotion CASCADE;
DROP SCHEMA IF EXISTS runtime CASCADE;
DROP SCHEMA IF EXISTS training CASCADE;
DROP SCHEMA IF EXISTS workflow_exec CASCADE;
