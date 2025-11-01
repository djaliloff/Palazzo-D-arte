-- CreateEnum
CREATE TYPE "Role" AS ENUM ('GESTIONNAIRE', 'ADMIN');

-- CreateEnum
CREATE TYPE "TypeClient" AS ENUM ('SIMPLE', 'PEINTRE');

-- CreateEnum
CREATE TYPE "UniteMesure" AS ENUM ('KG', 'PIECE');

-- CreateEnum
CREATE TYPE "Statut" AS ENUM ('VALIDE', 'RETOURNE_PARTIEL', 'RETOURNE_TOTAL');

-- CreateEnum
CREATE TYPE "TypeRetour" AS ENUM ('PARTIEL', 'TOTAL');

-- CreateTable
CREATE TABLE "utilisateurs" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "email" TEXT,
    "password" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'GESTIONNAIRE',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "utilisateurs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "prenom" TEXT,
    "email" TEXT,
    "telephone" TEXT,
    "adresse" TEXT,
    "type" "TypeClient" NOT NULL DEFAULT 'SIMPLE',
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marques" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "image" TEXT,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "image" TEXT,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produits" (
    "id" SERIAL NOT NULL,
    "reference" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "prixTotal" DOUBLE PRECISION NOT NULL,
    "poids" DOUBLE PRECISION,
    "uniteMesure" "UniteMesure" NOT NULL DEFAULT 'PIECE',
    "quantite_depos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "quantite_stock" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "seuilAlerte" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "venduParUnite" BOOLEAN NOT NULL DEFAULT true,
    "actif" BOOLEAN NOT NULL DEFAULT true,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "marqueId" INTEGER NOT NULL,
    "categorieId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "achats" (
    "id" SERIAL NOT NULL,
    "numeroBon" TEXT NOT NULL,
    "clientId" INTEGER NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "prix_total" DOUBLE PRECISION NOT NULL,
    "remiseGlobale" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prix_total_remise" DOUBLE PRECISION NOT NULL,
    "statut" "Statut" NOT NULL DEFAULT 'VALIDE',
    "dateAchat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "achats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_achats" (
    "id" SERIAL NOT NULL,
    "achatId" INTEGER NOT NULL,
    "produitId" INTEGER NOT NULL,
    "quantite" DOUBLE PRECISION NOT NULL,
    "quantiteRetournee" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "prixUnitaire" DOUBLE PRECISION NOT NULL,
    "remise" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "sousTotal" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lignes_achats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "retours" (
    "id" SERIAL NOT NULL,
    "numeroRetour" TEXT NOT NULL,
    "achatId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,
    "utilisateurId" INTEGER NOT NULL,
    "montantRembourse" DOUBLE PRECISION NOT NULL,
    "typeRetour" "TypeRetour" NOT NULL,
    "motif" TEXT,
    "dateRetour" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "retours_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lignes_retours" (
    "id" SERIAL NOT NULL,
    "retourId" INTEGER NOT NULL,
    "ligneAchatId" INTEGER NOT NULL,
    "produitId" INTEGER NOT NULL,
    "quantiteRetournee" DOUBLE PRECISION NOT NULL,
    "montantLigne" DOUBLE PRECISION NOT NULL,
    "motifDetaille" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lignes_retours_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "utilisateurs_email_key" ON "utilisateurs"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_email_key" ON "clients"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_telephone_key" ON "clients"("telephone");

-- CreateIndex
CREATE UNIQUE INDEX "marques_nom_key" ON "marques"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "categories_nom_key" ON "categories"("nom");

-- CreateIndex
CREATE UNIQUE INDEX "produits_reference_key" ON "produits"("reference");

-- CreateIndex
CREATE UNIQUE INDEX "achats_numeroBon_key" ON "achats"("numeroBon");

-- CreateIndex
CREATE UNIQUE INDEX "retours_numeroRetour_key" ON "retours"("numeroRetour");

-- AddForeignKey
ALTER TABLE "produits" ADD CONSTRAINT "produits_marqueId_fkey" FOREIGN KEY ("marqueId") REFERENCES "marques"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produits" ADD CONSTRAINT "produits_categorieId_fkey" FOREIGN KEY ("categorieId") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achats" ADD CONSTRAINT "achats_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "achats" ADD CONSTRAINT "achats_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_achats" ADD CONSTRAINT "lignes_achats_achatId_fkey" FOREIGN KEY ("achatId") REFERENCES "achats"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_achats" ADD CONSTRAINT "lignes_achats_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retours" ADD CONSTRAINT "retours_achatId_fkey" FOREIGN KEY ("achatId") REFERENCES "achats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retours" ADD CONSTRAINT "retours_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "retours" ADD CONSTRAINT "retours_utilisateurId_fkey" FOREIGN KEY ("utilisateurId") REFERENCES "utilisateurs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_retours" ADD CONSTRAINT "lignes_retours_retourId_fkey" FOREIGN KEY ("retourId") REFERENCES "retours"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_retours" ADD CONSTRAINT "lignes_retours_ligneAchatId_fkey" FOREIGN KEY ("ligneAchatId") REFERENCES "lignes_achats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lignes_retours" ADD CONSTRAINT "lignes_retours_produitId_fkey" FOREIGN KEY ("produitId") REFERENCES "produits"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
