import prisma from '../config/db.js';

/**
 * ============================================================
 * STOCK MANAGEMENT SERVICE
 * ============================================================
 * 
 * This service handles stock withdrawal logic with support for:
 * - Non-perishable products: Direct stock reduction
 * - Perishable products: FEFO (First Expired First Out) logic
 * 
 * STOCK LOGIC EXPLANATION:
 * ============================================================
 * 
 * quantite_stock (Current Available Stock):
 *    - Represents the current available quantity for sale
 *    - This value increases when stock is added and decreases when stock is withdrawn
 *    - Used to determine if products are available for purchase
 *    - Must always be >= 0
 * 
 * Perishable Products (perissable = true):
 *    - Products that have expiration dates (e.g., food, medicine)
 *    - Stock is managed through LotDeStock records
 *    - Each lot has a date_expiration
 *    - Stock withdrawal follows FEFO (First Expired First Out):
 *      * Always withdraw from the lot with the earliest expiration date first
 *      * This ensures products don't expire before being sold
 *    - quantite_stock is calculated as the sum of all non-expired lots
 * 
 * Non-Perishable Products (perissable = false):
 *    - Products without expiration dates (e.g., tools, paint)
 *    - Stock reduction is done directly on quantite_stock
 *    - No lot management needed
 *    - Simple subtraction from quantite_stock
 * 
 * ============================================================
 */

/**
 * Withdraw stock from a product
 * 
 * This function handles stock withdrawal for both perishable and non-perishable products.
 * For perishable products, it implements FEFO (First Expired First Out) logic.
 * 
 * @param {number} produitId - The ID of the product to withdraw stock from
 * @param {number} quantiteDemandee - The quantity to withdraw
 * @returns {Promise<Object>} - Object containing withdrawal details and updated product
 * @throws {Error} - If product not found, insufficient stock, or invalid quantity
 */
export const retirerStock = async (produitId, quantiteDemandee) => {
  // Validate input parameters
  if (!produitId || isNaN(produitId)) {
    throw new Error('Product ID is required and must be a valid number');
  }

  if (!quantiteDemandee || quantiteDemandee <= 0) {
    throw new Error('Quantity must be greater than 0');
  }

  // Fetch the product with its current stock and lots
  const produit = await prisma.produit.findUnique({
    where: { id: parseInt(produitId) },
    include: {
      lot_de_stock: {
        orderBy: {
          // For perishable products, order by expiration date (FEFO)
          // null dates (no expiration) go last
          date_expiration: {
            sort: 'asc',
            nulls: 'last'
          }
        }
      }
    }
  });

  // Check if product exists and is not deleted
  if (!produit || produit.deleted) {
    throw new Error('Product not found');
  }

  // Check if product is active
  if (!produit.actif) {
    throw new Error('Product is not active');
  }

  // Validate that there's enough stock available
  if (produit.quantite_stock < quantiteDemandee) {
    throw new Error(
      `Insufficient stock. Available: ${produit.quantite_stock}, Requested: ${quantiteDemandee}`
    );
  }

  // ============================================================
  // NON-PERISHABLE PRODUCT LOGIC
  // ============================================================
  // For non-perishable products, simply subtract from quantite_stock
  // No lot management needed
  if (!produit.perissable) {
    const newQuantiteStock = produit.quantite_stock - quantiteDemandee;

    // Update the product's stock directly
    const updatedProduit = await prisma.produit.update({
      where: { id: parseInt(produitId) },
      data: {
        quantite_stock: newQuantiteStock
      },
      include: {
        marque: true,
        categorie: true
      }
    });

    return {
      success: true,
      message: `Successfully withdrew ${quantiteDemandee} units from stock`,
      product: updatedProduit,
      withdrawnQuantity: quantiteDemandee,
      remainingStock: newQuantiteStock
    };
  }

  // ============================================================
  // PERISHABLE PRODUCT LOGIC (FEFO - First Expired First Out)
  // ============================================================
  // For perishable products, we need to withdraw from lots
  // following FEFO: always use the lot with earliest expiration first
  
  const now = new Date();
  let quantiteRestante = quantiteDemandee; // Remaining quantity to withdraw
  const lotsModifies = []; // Track which lots were modified

  // Filter out expired lots (they shouldn't be counted in available stock)
  // Only process lots that are not expired
  const lotsDisponibles = produit.lot_de_stock.filter(lot => {
    // If lot has no expiration date, include it (shouldn't happen for perishable, but handle it)
    if (!lot.date_expiration) {
      return true;
    }
    // Include only non-expired lots
    return new Date(lot.date_expiration) > now;
  });

  // Check if we have enough stock in available (non-expired) lots
  const stockDisponible = lotsDisponibles.reduce((sum, lot) => sum + lot.quantite, 0);
  if (stockDisponible < quantiteDemandee) {
    throw new Error(
      `Insufficient stock in available lots. Available: ${stockDisponible}, Requested: ${quantiteDemandee}`
    );
  }

  // Process each lot in order (earliest expiration first - FEFO)
  for (const lot of lotsDisponibles) {
    if (quantiteRestante <= 0) {
      break; // We've withdrawn all needed quantity
    }

    // Determine how much to withdraw from this lot
    const quantiteALot = Math.min(lot.quantite, quantiteRestante);

    if (quantiteALot === lot.quantite) {
      // This lot will be completely consumed - delete it
      await prisma.lotDeStock.delete({
        where: { id: lot.id }
      });
      lotsModifies.push({
        lotId: lot.id,
        action: 'deleted',
        quantity: lot.quantite
      });
    } else {
      // This lot will be partially consumed - update it
      const nouvelleQuantite = lot.quantite - quantiteALot;
      await prisma.lotDeStock.update({
        where: { id: lot.id },
        data: {
          quantite: nouvelleQuantite
        }
      });
      lotsModifies.push({
        lotId: lot.id,
        action: 'updated',
        oldQuantity: lot.quantite,
        newQuantity: nouvelleQuantite,
        withdrawnQuantity: quantiteALot
      });
    }

    // Reduce the remaining quantity to withdraw
    quantiteRestante -= quantiteALot;
  }

  // Recalculate quantite_stock from remaining lots
  // This ensures quantite_stock always reflects the actual available stock
  const lotsRestants = await prisma.lotDeStock.findMany({
    where: {
      produitId: parseInt(produitId),
      // Only count non-expired lots for perishable products
      ...(produit.perissable && {
        date_expiration: {
          gt: now // Greater than now (not expired)
        }
      })
    }
  });

  const nouveauStock = lotsRestants.reduce((sum, lot) => sum + lot.quantite, 0);

  // Update the product's quantite_stock to match the actual available stock
  const updatedProduit = await prisma.produit.update({
    where: { id: parseInt(produitId) },
    data: {
      quantite_stock: nouveauStock
    },
    include: {
      marque: true,
      categorie: true,
      lot_de_stock: {
        orderBy: {
          date_expiration: {
            sort: 'asc',
            nulls: 'last'
          }
        }
      }
    }
  });

  return {
    success: true,
    message: `Successfully withdrew ${quantiteDemandee} units from stock using FEFO logic`,
    product: updatedProduit,
    withdrawnQuantity: quantiteDemandee,
    remainingStock: nouveauStock,
    lotsModified: lotsModifies
  };
};

