DELETE FROM "LocationPoint";

DROP INDEX IF EXISTS "LocationPoint_tsMs_idx";
DROP INDEX IF EXISTS "LocationPoint_createdAt_idx";

ALTER TABLE "LocationPoint"
    DROP CONSTRAINT IF EXISTS "LocationPoint_pkey",
    DROP COLUMN IF EXISTS "id",
    DROP COLUMN IF EXISTS "tsMs",
    ADD COLUMN "timestampUtc" TIMESTAMP(3) NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "LocationPoint_timestampUtc_key" ON "LocationPoint"("timestampUtc");
CREATE INDEX IF NOT EXISTS "LocationPoint_createdAt_idx" ON "LocationPoint"("createdAt");
