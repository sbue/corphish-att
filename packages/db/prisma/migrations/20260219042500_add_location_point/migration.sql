CREATE TABLE IF NOT EXISTS "LocationPoint" (
    "id" TEXT NOT NULL,
    "tsMs" BIGINT NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "lon" DOUBLE PRECISION NOT NULL,
    "accuracyM" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LocationPoint_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "LocationPoint_tsMs_idx" ON "LocationPoint"("tsMs");
CREATE INDEX IF NOT EXISTS "LocationPoint_createdAt_idx" ON "LocationPoint"("createdAt");
