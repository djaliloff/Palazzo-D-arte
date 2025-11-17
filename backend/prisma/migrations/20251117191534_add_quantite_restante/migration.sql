/*
  Migration: add column `quantite_restante` to `lots_de_stock`.
  - We add the column with a default so it can be applied on an existing non-empty table.
  - Then we initialize `quantite_restante` = `quantite` for all existing rows.
*/

-- 1) Add column with a default for existing rows
ALTER TABLE "lots_de_stock" ADD COLUMN "quantite_restante" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- 2) Initialize quantite_restante from quantite for existing lots
UPDATE "lots_de_stock"
SET "quantite_restante" = "quantite"
WHERE "quantite_restante" = 0;

-- (Optional) keep or drop default at DB level depending on preference
-- ALTER TABLE "lots_de_stock" ALTER COLUMN "quantite_restante" DROP DEFAULT;
