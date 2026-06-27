# PgBouncer — طبقة تجميع اتصالات PostgreSQL
# يُشغَّل كخدمة منفصلة بين التطبيق و Postgres (Railway أو Docker).

FROM edoburu/pgbouncer:1.22.1-p0

# الإعداد عبر متغيرات البيئة (انظر README):
# DATABASE_URL — رابط Postgres الداخلي (مباشر)
# POOL_MODE=transaction
# MAX_CLIENT_CONN=200
# DEFAULT_POOL_SIZE=15
# AUTH_TYPE=scram-sha-256

EXPOSE 5432
