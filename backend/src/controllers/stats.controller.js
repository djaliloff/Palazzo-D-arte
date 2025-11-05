import prisma from '../config/db.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middlewares/error.middleware.js';

/**
 * Get dashboard statistics
 * GET /api/stats/dashboard
 */
export const getDashboardStats = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.dateAchat = {};
    if (startDate) dateFilter.dateAchat.gte = new Date(startDate);
    if (endDate) dateFilter.dateAchat.lte = new Date(endDate);
  }

  // Total sales (prix_total_remise après remises)
  const totalSales = await prisma.achat.aggregate({
    where: dateFilter,
    _sum: {
      prix_total_remise: true
    }
  });

  // Calculate total returns for the same period
  const totalReturns = await prisma.retour.aggregate({
    where: {
      dateRetour: dateFilter.dateAchat || undefined
    },
    _sum: {
      montantRembourse: true
    }
  });

  // Net sales (sales - returns)
  const netSales = (totalSales._sum.prix_total_remise || 0) - (totalReturns._sum.montantRembourse || 0);

  // Total purchases
  const totalPurchases = await prisma.achat.count({
    where: dateFilter
  });


  // Active clients
  const activeClients = await prisma.client.count({
    where: { actif: true }
  });

  // Low stock products - need to fetch and filter in JavaScript
  const allProduits = await prisma.produit.findMany({
    where: {
      deleted: false,
      actif: true
    }
  });
  const lowStockCount = allProduits.filter(
    produit => produit.quantite_stock <= produit.seuilAlerte
  ).length;

  // Recent purchases
  const recentPurchases = await prisma.achat.findMany({
    where: dateFilter,
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: {
      client: {
        select: {
          nom: true,
          prenom: true
        }
      }
    }
  });

  // Sales by day (using prix_total_remise)
  const salesByDay = await prisma.achat.groupBy({
    by: ['dateAchat'],
    where: dateFilter,
    _sum: {
      prix_total_remise: true
    },
    _count: {
      id: true
    },
    orderBy: {
      dateAchat: 'asc'
    }
  });

  // Get returns by day
  const returnsByDay = await prisma.retour.groupBy({
    by: ['dateRetour'],
    where: {
      dateRetour: dateFilter.dateAchat || undefined
    },
    _sum: {
      montantRembourse: true
    },
    _count: {
      id: true
    },
    orderBy: {
      dateRetour: 'asc'
    }
  });

  // Combine sales and returns by day
  const salesByDayMap = new Map();
  salesByDay.forEach(item => {
    const dateKey = new Date(item.dateAchat).toISOString().split('T')[0];
    salesByDayMap.set(dateKey, {
      date: item.dateAchat,
      sales: item._sum.prix_total_remise || 0,
      count: item._count.id || 0,
      returns: 0
    });
  });

  returnsByDay.forEach(item => {
    const dateKey = new Date(item.dateRetour).toISOString().split('T')[0];
    if (salesByDayMap.has(dateKey)) {
      salesByDayMap.get(dateKey).returns = item._sum.montantRembourse || 0;
    } else {
      salesByDayMap.set(dateKey, {
        date: item.dateRetour,
        sales: 0,
        count: 0,
        returns: item._sum.montantRembourse || 0
      });
    }
  });

  res.json({
    totalSales: totalSales._sum.prix_total_remise || 0,
    netSales,
    totalPurchases,
    totalReturns: totalReturns._sum.montantRembourse || 0,
    activeClients,
    lowStockCount,
    recentPurchases,
    salesByDay: Array.from(salesByDayMap.values()).map(item => ({
      date: item.date,
      sales: item.sales,
      returns: item.returns,
      net: item.sales - item.returns,
      count: item.count
    }))
  });
});

/**
 * Get sales statistics
 * GET /api/stats/sales
 */
export const getSalesStats = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.dateAchat = {};
    if (startDate) dateFilter.dateAchat.gte = new Date(startDate);
    if (endDate) dateFilter.dateAchat.lte = new Date(endDate);
  }

  if (groupBy === 'product') {
    const salesByProduct = await prisma.ligneAchat.groupBy({
      by: ['produitId'],
      where: {
        achat: dateFilter
      },
      _sum: {
        quantite: true,
        sousTotal: true
      },
      orderBy: {
        _sum: {
          sousTotal: 'desc'
        }
      },
      take: 10
    });

    // Enrich with product details
    const enrichedSales = await Promise.all(
      salesByProduct.map(async (sale) => {
        const produit = await prisma.produit.findUnique({
          where: { id: sale.produitId },
          select: {
            nom: true,
            reference: true
          }
        });
        return {
          ...sale,
          produit
        };
      })
    );

    return res.json(enrichedSales);
  }

  if (groupBy === 'category') {
    const salesByCategory = await prisma.ligneAchat.groupBy({
      by: ['produitId'],
      where: {
        achat: dateFilter
      },
      _sum: {
        sousTotal: true
      }
    });

    // Aggregate by category
    const categoryMap = {};
    for (const sale of salesByCategory) {
      const produit = await prisma.produit.findUnique({
        where: { id: sale.produitId },
        include: {
          categorie: true
        }
      });

      if (produit) {
        const catId = produit.categorie.id;
        const catName = produit.categorie.nom;
        if (!categoryMap[catId]) {
          categoryMap[catId] = {
            categorie: catName,
            total: 0
          };
        }
        categoryMap[catId].total += sale._sum.sousTotal || 0;
      }
    }

    return res.json(Object.values(categoryMap));
  }

  // Get total returns for the period
  const returnsStats = await prisma.retour.aggregate({
    where: {
      dateRetour: dateFilter.dateAchat || undefined
    },
    _sum: {
      montantRembourse: true
    },
    _count: {
      id: true
    }
  });

  // Default: return basic stats
  const stats = {
    totalAmount: await prisma.achat.aggregate({
      where: dateFilter,
      _sum: { prix_total_remise: true }
    }),
    totalCount: await prisma.achat.count({
      where: dateFilter
    }),
    averageAmount: 0,
    totalReturns: returnsStats._sum.montantRembourse || 0,
    returnsCount: returnsStats._count.id || 0
  };

  if (stats.totalCount > 0) {
    stats.averageAmount = (stats.totalAmount._sum.prix_total_remise || 0) / stats.totalCount;
  }

  stats.netSales = (stats.totalAmount._sum.prix_total_remise || 0) - (stats.totalReturns || 0);

  res.json(stats);
});

/**
 * Get total amount per brand (sum of sousTotal of lines)
 * GET /api/stats/brands/amounts
 */
export const getAmountsByBrand = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;
  const whereAchat = {};
  if (startDate || endDate) {
    whereAchat.dateAchat = {};
    if (startDate) whereAchat.dateAchat.gte = new Date(startDate);
    if (endDate) whereAchat.dateAchat.lte = new Date(endDate);
  }

  // Fetch lines with product->brand
  const lignes = await prisma.ligneAchat.findMany({
    where: {
      achat: whereAchat
    },
    include: {
      produit: { include: { marque: true } }
    }
  });

  const brandMap = new Map();
  for (const l of lignes) {
    if (!l.produit?.marque) continue;
    const key = l.produit.marque.id;
    const name = l.produit.marque.nom;
    const current = brandMap.get(key) || { marqueId: key, marque: name, total: 0 };
    current.total += parseFloat(l.sousTotal || 0);
    brandMap.set(key, current);
  }

  res.json(Array.from(brandMap.values()).sort((a,b) => b.total - a.total));
});

/**
 * Get top products per brand
 * GET /api/stats/brands/top-products
 */
export const getTopProductsPerBrand = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit } = req.query;
  const topN = parseInt(limit) || 5;
  const whereAchat = {};
  if (startDate || endDate) {
    whereAchat.dateAchat = {};
    if (startDate) whereAchat.dateAchat.gte = new Date(startDate);
    if (endDate) whereAchat.dateAchat.lte = new Date(endDate);
  }

  const lignes = await prisma.ligneAchat.findMany({
    where: { achat: whereAchat },
    include: {
      produit: { include: { marque: true } }
    }
  });

  const result = {};
  for (const l of lignes) {
    const marque = l.produit?.marque;
    if (!marque) continue;
    const bKey = marque.id;
    if (!result[bKey]) {
      result[bKey] = { marqueId: bKey, marque: marque.nom, products: new Map() };
    }
    const pKey = l.produit.id;
    const prodAgg = result[bKey].products.get(pKey) || {
      produitId: pKey,
      produitNom: l.produit.nom,
      reference: l.produit.reference,
      quantite: 0,
      montant: 0
    };
    prodAgg.quantite += parseFloat(l.quantite || 0);
    prodAgg.montant += parseFloat(l.sousTotal || 0);
    result[bKey].products.set(pKey, prodAgg);
  }

  const output = Object.values(result).map(group => {
    const products = Array.from(group.products.values())
      .sort((a,b) => b.montant - a.montant)
      .slice(0, topN);
    return { marqueId: group.marqueId, marque: group.marque, products };
  });

  res.json(output);
});

/**
 * Get top products per category
 * GET /api/stats/categories/top-products
 */
export const getTopProductsPerCategory = asyncHandler(async (req, res) => {
  const { startDate, endDate, limit } = req.query;
  const topN = parseInt(limit) || 5;
  const whereAchat = {};
  if (startDate || endDate) {
    whereAchat.dateAchat = {};
    if (startDate) whereAchat.dateAchat.gte = new Date(startDate);
    if (endDate) whereAchat.dateAchat.lte = new Date(endDate);
  }

  const lignes = await prisma.ligneAchat.findMany({
    where: { achat: whereAchat },
    include: {
      produit: { include: { categorie: true } }
    }
  });

  const result = {};
  for (const l of lignes) {
    const categorie = l.produit?.categorie;
    if (!categorie) continue;
    const cKey = categorie.id;
    if (!result[cKey]) {
      result[cKey] = { categorieId: cKey, categorie: categorie.nom, products: new Map() };
    }
    const pKey = l.produit.id;
    const prodAgg = result[cKey].products.get(pKey) || {
      produitId: pKey,
      produitNom: l.produit.nom,
      reference: l.produit.reference,
      quantite: 0,
      montant: 0
    };
    prodAgg.quantite += parseFloat(l.quantite || 0);
    prodAgg.montant += parseFloat(l.sousTotal || 0);
    result[cKey].products.set(pKey, prodAgg);
  }

  const output = Object.values(result).map(group => {
    const products = Array.from(group.products.values())
      .sort((a,b) => b.montant - a.montant)
      .slice(0, topN);
    return { categorieId: group.categorieId, categorie: group.categorie, products };
  });

  res.json(output);
});

/**
 * Get top clients with optional type filter
 * GET /api/stats/top-clients?type=SIMPLE|PEINTRE
 */
export const getTopClients = asyncHandler(async (req, res) => {
  const { startDate, endDate, type, limit } = req.query;
  const topN = parseInt(limit) || 10;
  const whereAchat = {};
  if (startDate || endDate) {
    whereAchat.dateAchat = {};
    if (startDate) whereAchat.dateAchat.gte = new Date(startDate);
    if (endDate) whereAchat.dateAchat.lte = new Date(endDate);
  }

  const whereClient = {};
  if (type) whereClient.type = type;

  const achats = await prisma.achat.findMany({
    where: { ...whereAchat, client: whereClient },
    include: { client: true }
  });

  const map = new Map();
  for (const a of achats) {
    if (!a.client) continue;
    const key = a.client.id;
    const current = map.get(key) || { clientId: key, nom: a.client.nom, prenom: a.client.prenom, type: a.client.type, total: 0, count: 0 };
    current.total += parseFloat(a.prix_total_remise || 0);
    current.count += 1;
    map.set(key, current);
  }

  const list = Array.from(map.values()).sort((a,b) => b.total - a.total).slice(0, topN);
  res.json(list);
});

