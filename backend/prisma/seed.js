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
  console.log('   🔑 Password for both: password123\n');

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
        prenom: 'Sarah',
        email: 'sarah.bouras@email.com',
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
    // Paint products (sold by KG)
    prisma.produit.create({
      data: {
        reference: 'P-001',
        nom: 'Peinture Loggia Blanc Mat 30kg',
        description: 'Peinture murale intérieure mate, excellente couverture',
        prixUnitaire: 500, // 500 DA per kg
        prixTotal: 15000, // 30kg × 500
        poids: 30,
        uniteMesure: 'KG',
        quantite_depos: 100,
        quantite_stock: 100,
        seuilAlerte: 20,
        venduParUnite: true, // Can sell partial kg (e.g., 5.5kg)
        marqueId: marques[0].id, // Loggia
        categorieId: categories[0].id, // peinture
        actif: true,
      },
    }),
    prisma.produit.create({
      data: {
        reference: 'P-002',
        nom: 'Peinture Casapaint Bleu Océan 25kg',
        description: 'Peinture acrylique pour intérieur et extérieur',
        prixUnitaire: 600,
        prixTotal: 15000,
        poids: 25,
        uniteMesure: 'KG',
        quantite_depos: 80,
        quantite_stock: 80,
        seuilAlerte: 15,
        venduParUnite: true,
        marqueId: marques[4].id, // Casapaint
        categorieId: categories[0].id,
        actif: true,
      },
    }),
    prisma.produit.create({
      data: {
        reference: 'P-003',
        nom: 'Peinture Valpaint Rouge Passion 20kg',
        description: 'Peinture décorative effet velours',
        prixUnitaire: 800,
        prixTotal: 16000,
        poids: 20,
        uniteMesure: 'KG',
        quantite_depos: 50,
        quantite_stock: 50,
        seuilAlerte: 10,
        venduParUnite: true,
        marqueId: marques[5].id, // Valpaint
        categorieId: categories[0].id,
        actif: true,
      },
    }),
    
    // Tools (sold by PIECE only)
    prisma.produit.create({
      data: {
        reference: 'P-004',
        nom: 'Pinceau Rolux Professionnel N°12',
        description: 'Pinceau plat en soie naturelle, manche bois',
        prixUnitaire: 800,
        prixTotal: 800,
        uniteMesure: 'PIECE',
        quantite_depos: 150,
        quantite_stock: 150,
        seuilAlerte: 30,
        venduParUnite: false, // Only whole pieces
        marqueId: marques[3].id, // Rolux
        categorieId: categories[3].id, // outil
        actif: true,
      },
    }),
    prisma.produit.create({
      data: {
        reference: 'P-005',
        nom: 'Rouleau Rolux 25cm',
        description: 'Rouleau en mousse haute densité',
        prixUnitaire: 1200,
        prixTotal: 1200,
        uniteMesure: 'PIECE',
        quantite_depos: 100,
        quantite_stock: 100,
        seuilAlerte: 20,
        venduParUnite: false,
        marqueId: marques[3].id,
        categorieId: categories[3].id,
        actif: true,
      },
    }),
    prisma.produit.create({
      data: {
        reference: 'P-006',
        nom: 'Spatule Professionnelle 10cm',
        description: 'Spatule en acier inoxydable, manche ergonomique',
        prixUnitaire: 650,
        prixTotal: 650,
        uniteMesure: 'PIECE',
        quantite_depos: 80,
        quantite_stock: 80,
        seuilAlerte: 15,
        venduParUnite: false,
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
        produitId: produits[0].id, // Peinture Loggia 30kg
        quantite: 30,
        prixUnitaire: 500,
        sousTotal: 15000,
      },
    }),
    prisma.ligneAchat.create({
      data: {
        achatId: sampleAchat.id,
        produitId: produits[3].id, // Pinceau
        quantite: 5,
        prixUnitaire: 800,
        sousTotal: 4000,
      },
    }),
  ]);

  // Update product stock
  await prisma.produit.update({
    where: { id: produits[0].id },
    data: { quantite_stock: 70 }, // 100 - 30
  });
  await prisma.produit.update({
    where: { id: produits[3].id },
    data: { quantite_stock: 145 }, // 150 - 5
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