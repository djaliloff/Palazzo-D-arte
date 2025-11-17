import { ModeVente } from '@prisma/client';

export type ComputeSalePriceResult = {
  montant: number;
  base: string;
  prixUtilise: number;
};

export type ComputeSalePriceParams = {
  modeVente: ModeVente;
  prixTotal?: number | null;
  prixPartiel?: number | null;
  uniteMesure?: string | null;
  quantite?: number;
  vendreTotal?: boolean;
};

export function computeSalePrice({
  modeVente,
  prixTotal,
  prixPartiel,
  uniteMesure,
  quantite = 1,
  vendreTotal
}: ComputeSalePriceParams): ComputeSalePriceResult {
  const qty = Number(quantite);
  if (!Number.isFinite(qty) || qty <= 0) {
    throw new Error('La quantité doit être un nombre positif');
  }

  switch (modeVente) {
    case ModeVente.TOTAL: {
      if (prixTotal == null) {
        throw new Error('prixTotal requis pour ce produit');
      }
      return {
        montant: prixTotal * qty,
        base: 'TOTAL',
        prixUtilise: prixTotal
      };
    }

    case ModeVente.PARTIAL: {
      if (prixPartiel == null || uniteMesure == null) {
        throw new Error('prixPartiel et uniteMesure requis pour la vente partielle');
      }
      return {
        montant: prixPartiel * qty,
        base: `PARTIAL (${uniteMesure})`,
        prixUtilise: prixPartiel
      };
    }

    case ModeVente.BOTH: {
      if (vendreTotal) {
        if (prixTotal == null) {
          throw new Error('prixTotal requis pour la vente totale');
        }
        return {
          montant: prixTotal * qty,
          base: 'TOTAL',
          prixUtilise: prixTotal
        };
      }

      if (prixPartiel == null || uniteMesure == null) {
        throw new Error('prixPartiel et uniteMesure requis pour la vente partielle');
      }

      return {
        montant: prixPartiel * qty,
        base: `PARTIAL (${uniteMesure})`,
        prixUtilise: prixPartiel
      };
    }

    default:
      throw new Error('Mode de vente inconnu');
  }
}
