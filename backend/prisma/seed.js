import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...\n');

  // Clear existing data (in correct order to avoid FK constraints)
  await prisma.ligneRetour.deleteMany();
  await prisma.retour.deleteMany();
  await prisma.ligneAchat.deleteMany();
  await prisma.achat.deleteMany();
  await prisma.produit.deleteMany();
  await prisma.marque.deleteMany();
  await prisma.categorie.deleteMany();
  await prisma.client.deleteMany();
  await prisma.utilisateur.deleteMany();

  console.log('🗑️  Cleared existing data\n');

  // ============================================
  // SEED BRANDS (MARQUES)
  // ============================================
  const marques = await Promise.all([
    prisma.marque.create({
      data: {
        nom: 'Loggia',
        description: 'Marque algérienne de peinture professionnelle',
        actif: true,
      },
    }),
    prisma.marque.create({
      data: {
        nom: 'Venixia',
        description: 'Peintures décoratives italiennes haut de gamme',
        actif: true,
      },
    }),
    prisma.marque.create({
      data: {
        nom: 'Pigma Color',
        description: 'Pigments et colorants haute qualité',
        actif: true,
      },
    }),
    prisma.marque.create({
      data: {
        nom: 'Rolux',
        description: 'Rouleaux et accessoires de peinture professionnels',
        actif: true,
      },
    }),
    prisma.marque.create({
      data: {
        nom: 'Casapaint',
        description: 'Peintures pour intérieur et extérieur',
        actif: true,
      },
    }),
    prisma.marque.create({
      data: {
        nom: 'Valpaint',
        description: 'Peintures décoratives et effets spéciaux haut de gamme',
        actif: true,
      },
    }),
  ]);

  console.log('✅ Created 6 brands (marques)');

  // ============================================
  // SEED CATEGORIES
  // ============================================
  const categories = await Promise.all([
    prisma.categorie.create({
      data: {
        nom: 'peinture',
        description: 'Peintures acryliques, à l\'huile, murales, décoratives',
        actif: true,
      },
    }),
    prisma.categorie.create({
      data: {
        nom: 'accessoires',
        description: 'Palettes, médiums, diluants, colles',
        actif: true,
      },
    }),
    prisma.categorie.create({
      data: {
        nom: 'supports',
        description: 'Toiles, châssis, panneaux, papiers',
        actif: true,
      },
    }),
    prisma.categorie.create({
      data: {
        nom: 'outil',
        description: 'Pinceaux, rouleaux, spatules, couteaux à peindre',
        actif: true,
      },
    }),
  ]);

  console.log('✅ Created 4 categories\n');

  // ============================================
  // SEED USERS (UTILISATEURS)
  // ============================================
  const hashedPassword = await bcrypt.hash('djalildjt', 10);

  const admin = await prisma.utilisateur.create({
    data: {
      nom: 'Admin',
      prenom: 'admin',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'ADMIN',
      actif: true,
    },
  });

  const gestionnaire = await prisma.utilisateur.create({
    data: {
      nom: 'djalil',
      prenom: 'djt',
      email: 'djalil@gmail.com',
      password: hashedPassword,
      role: 'GESTIONNAIRE',
      actif: true,
    },
  });

  console.log('✅ Created 2 users:');
  console.log('   🔑 Password for both: djalildjt\n');

  // ============================================
  // SEED CLIENTS
  // ============================================
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        nom: 'Ziani',
        prenom: 'Mohamed',
        email: 'mohamed.ziani@email.com',
        telephone: '0555123456',
        adresse: '12 Rue Didouche Mourad, Alger',
        type: 'SIMPLE',
        actif: true,
      },
    }),
    prisma.client.create({
      data: {
        nom: 'Bouras',
        prenom: 'Salah',
        email: 'salah.bouras@email.com',
        telephone: '0666234567',
        adresse: '45 Avenue Pasteur, Oran',
        type: 'PEINTRE',
        actif: true,
      },
    }),
    prisma.client.create({
      data: {
        nom: 'Meziani',
        prenom: 'Karim',
        email: 'karim.meziani@email.com',
        telephone: '0777345678',
        adresse: '78 Rue Larbi Ben M\'hidi, Constantine',
        type: 'PEINTRE',
        actif: true,
      },
    }),
  ]);

  console.log('✅ Created 3 clients (1 simple, 2 peintres)\n');

  // ============================================
  // SEED PRODUCTS (PRODUITS)
  // ============================================
  const produits = await Promise.all([
    // TOTAL sale only
    prisma.produit.create({
      data: {
        reference: 'P-001',
        nom: 'Peinture Loggia Blanc Mat 30kg',
        description: 'Peinture murale intérieure mate, excellente couverture',
        modeVente: 'TOTAL',
        prixTotal: 15000,
        poids: 30,
        quantite_stock: 50,
        seuilAlerte: 10,
        marqueId: marques[0].id,
        categorieId: categories[0].id,
        actif: true,
      },
    }),
    prisma.produit.create({
      data: {
        reference: 'P-002',
        nom: 'Peinture Casapaint Bleu Océan 25kg',
        description: 'Peinture acrylique pour intérieur et extérieur',
        modeVente: 'TOTAL',
        prixTotal: 13000,
        poids: 25,
        quantite_stock: 40,
        seuilAlerte: 8,
        marqueId: marques[4].id,
        categorieId: categories[0].id,
        actif: true,
      },
    }),

    // PARTIAL sale only
    prisma.produit.create({
      data: {
        reference: 'P-003',
        nom: 'Pigment Pigma Color Rouge 1kg',
        description: 'Pigment concentré pour mélange personnalisé',
        modeVente: 'PARTIAL',
        prixPartiel: 1200,
        uniteMesure: 'KG',
        quantite_stock: 25,
        seuilAlerte: 5,
        marqueId: marques[2].id,
        categorieId: categories[0].id,
        actif: true,
      },
    }),
    prisma.produit.create({
      data: {
        reference: 'P-004',
        nom: 'Vernis Protecteur 5L',
        description: 'Vernis transparent pour finitions mates',
        modeVente: 'PARTIAL',
        prixPartiel: 900,
        uniteMesure: 'LITRE',
        quantite_stock: 18,
        seuilAlerte: 4,
        marqueId: marques[1].id,
        categorieId: categories[0].id,
        actif: true,
      },
    }),

    // BOTH sale modes
    prisma.produit.create({
      data: {
        reference: 'P-005',
        nom: 'Peinture Valpaint Rouge Passion 20kg',
        description: 'Peinture décorative effet velours',
        modeVente: 'BOTH',
        prixTotal: 18000,
        prixPartiel: 950,
        uniteMesure: 'KG',
        quantite_stock: 35,
        seuilAlerte: 7,
        marqueId: marques[5].id,
        categorieId: categories[0].id,
        actif: true,
      },
    }),
    prisma.produit.create({
      data: {
        reference: 'P-006',
        nom: 'Peinture Murale Premium 5L',
        description: 'Peinture blanche premium, couvre 50 m²',
        modeVente: 'BOTH',
        prixTotal: 7000,
        prixPartiel: 1600,
        uniteMesure: 'LITRE',
        quantite_stock: 22,
        seuilAlerte: 6,
        marqueId: marques[0].id,
        categorieId: categories[0].id,
        actif: true,
      },
    }),

    // Tools sold totally
    prisma.produit.create({
      data: {
        reference: 'P-007',
        nom: 'Pinceau Rolux Professionnel N°12',
        description: 'Pinceau plat en soie naturelle, manche bois',
        modeVente: 'TOTAL',
        prixTotal: 900,
        uniteMesure: 'PIECE',
        quantite_stock: 120,
        seuilAlerte: 25,
        marqueId: marques[3].id,
        categorieId: categories[3].id,
        actif: true,
      },
    }),
    prisma.produit.create({
      data: {
        reference: 'P-008',
        nom: 'Rouleau Rolux 25cm',
        description: 'Rouleau en mousse haute densité',
        modeVente: 'TOTAL',
        prixTotal: 1400,
        uniteMesure: 'PIECE',
        quantite_stock: 90,
        seuilAlerte: 18,
        marqueId: marques[3].id,
        categorieId: categories[3].id,
        actif: true,
      },
    }),
  ]);

  console.log('✅ Created 6 products:');
  console.log('   🎨 3 paint products (sold by KG)');
  console.log('   🔧 3 tools (sold by PIECE)\n');

  // ============================================
  // SEED SAMPLE PURCHASE (ACHAT)
  // ============================================
  const sampleAchat = await prisma.achat.create({
    data: {
      numeroBon: `BON-${Date.now()}`,
      clientId: clients[0].id,
      utilisateurId: admin.id,
      prix_total: 19000,
      remiseGlobale: 0,
      prix_total_remise: 19000,
      statut: 'VALIDE',
      notes: 'Sample purchase for testing',
    },
  });

  await Promise.all([
    prisma.ligneAchat.create({
      data: {
        achatId: sampleAchat.id,
        produitId: produits[4].id, // Produit BOTH (kg)
        quantite: 10,
        prixUnitaire: 950,
        sousTotal: 9500,
      },
    }),
    prisma.ligneAchat.create({
      data: {
        achatId: sampleAchat.id,
        produitId: produits[6].id, // Pinceau TOTAL
        quantite: 8,
        prixUnitaire: 900,
        sousTotal: 7200,
      },
    }),
  ]);

  // Update product stock
  await prisma.produit.update({
    where: { id: produits[4].id },
    data: { quantite_stock: 25 },
  });
  await prisma.produit.update({
    where: { id: produits[6].id },
    data: { quantite_stock: 112 },
  });

  console.log('✅ Created 1 sample purchase:');
  console.log(`   📝 ${sampleAchat.numeroBon}`);
  console.log('   👤 Client: Mohamed Ziani');
  console.log('   📦 2 items: 30kg paint + 5 brushes');
  console.log('   💰 Total: 19,000 DA\n');

  console.log('🎉 Database seeded successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('📊 Summary:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✓ 6 Brands');
  console.log('✓ 4 Categories');
  console.log('✓ 2 Users');
  console.log('✓ 3 Clients');
  console.log('✓ 6 Products');
  console.log('✓ 1 Sample Purchase');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });