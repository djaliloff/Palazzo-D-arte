/*
  Warnings:

  - You are about to drop the `LotDeStock` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."LotDeStock" DROP CONSTRAINT "LotDeStock_produitId_fkey";

-- AlterTable
ALTER TABLE "produits" ADD COLUMN     "perissable" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "public"."LotDeStock";

-- CreateTable
CREATE TABLE "lots_de_stock" (
    "id" SERIAL NOT NULL,
    "produitId" INTEGER NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "date_expiration" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lots_de_stock_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "lots_de_stock" ADD CONSTRAINT "lots_de_stock_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
