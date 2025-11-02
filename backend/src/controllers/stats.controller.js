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

  // Total sales
  const totalSales = await prisma.achat.aggregate({
    where: dateFilter,
    _sum: {
      prix_total: true
    }
  });

  // Total purchases
  const totalPurchases = await prisma.achat.count({
    where: dateFilter
  });

  // Total returns
  const totalReturns = await prisma.retour.aggregate({
    where: {
      dateRetour: dateFilter.dateAchat || undefined
    },
    _sum: {
      montantRembourse: true
    }
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

  // Sales by day
  const salesByDay = await prisma.achat.groupBy({
    by: ['dateAchat'],
    where: dateFilter,
    _sum: {
      prix_total: true
    },
    orderBy: {
      dateAchat: 'asc'
    }
  });

  res.json({
    totalSales: totalSales._sum.prix_total || 0,
    totalPurchases,
    totalReturns: totalReturns._sum.montantRembourse || 0,
    activeClients,
    lowStockCount,
    recentPurchases,
    salesByDay: salesByDay.map(item => ({
      date: item.dateAchat,
      total: item._sum.prix_total || 0
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

  // Default: return basic stats
  const stats = {
    totalAmount: await prisma.achat.aggregate({
      where: dateFilter,
      _sum: { prix_total: true }
    }),
    totalCount: await prisma.achat.count({
      where: dateFilter
    }),
    averageAmount: 0
  };

  if (stats.totalCount > 0) {
    stats.averageAmount = (stats.totalAmount._sum.prix_total || 0) / stats.totalCount;
  }

  res.json(stats);
});

