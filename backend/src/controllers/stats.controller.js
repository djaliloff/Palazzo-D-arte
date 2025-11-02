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

