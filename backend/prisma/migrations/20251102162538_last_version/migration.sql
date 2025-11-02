/*
  Warnings:

  - You are about to drop the column `date_expiration` on the `produits` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "achats" ADD COLUMN     "versment" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "produits" DROP COLUMN "date_expiration";

-- CreateTable
CREATE TABLE "LotDeStock" (
    "id" SERIAL NOT NULL,
    "produitId" INTEGER NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "date_expiration" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LotDeStock_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "LotDeStock" ADD CONSTRAINT "LotDeStock_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
