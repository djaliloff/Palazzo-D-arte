import { ModeVente } from '@prisma/client';

const ensurePositiveNumber = (value, label) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`${label} doit être un nombre positif`);
  }
  return parsed;
};

export const computeSalePrice = ({
  modeVente,
  prixTotal,
  prixPartiel,
  uniteMesure,
  poids,
  quantite = 1,
  vendreTotal
}) => {
  if (!modeVente) {
    throw new Error('Mode de vente manquant');
  }

  const qty = ensurePositiveNumber(quantite, 'La quantité');

  switch (modeVente) {
    case ModeVente.TOTAL: {
      if (!Number.isInteger(qty)) {
        throw new Error('La quantité doit être un entier pour la vente totale');
      }
      if (prixTotal == null) {
        throw new Error('prixTotal requis pour ce produit');
      }
      return {
        montant: prixTotal * qty,
        base: 'TOTAL',
        prixUtilise: prixTotal,
        quantiteRetrait: qty
      };
    }

    case ModeVente.PARTIAL: {
      if (vendreTotal) {
        throw new Error('La vente totale est impossible pour ce produit');
      }
      if (prixPartiel == null || uniteMesure == null) {
        throw new Error('prixPartiel et uniteMesure requis pour la vente partielle');
      }
      return {
        montant: prixPartiel * qty,
        base: `PARTIAL (${uniteMesure})`,
        prixUtilise: prixPartiel,
        quantiteRetrait: qty
      };
    }

    case ModeVente.BOTH: {
      if (vendreTotal) {
        if (!Number.isInteger(qty)) {
          throw new Error('La quantité doit être un entier pour la vente totale');
        }
        if (prixTotal == null) {
          throw new Error('prixTotal requis pour la vente totale');
        }
        return {
          montant: prixTotal * qty,
          base: 'TOTAL',
          prixUtilise: prixTotal,
          quantiteRetrait: qty
        };
      }

      if (prixPartiel == null || uniteMesure == null) {
        throw new Error('prixPartiel et uniteMesure requis pour la vente partielle');
      }
      // Si un poids valide est défini, on utilise la logique de conversion
      if (poids && Number.isFinite(Number(poids)) && Number(poids) > 0) {
        const poidsValue = Number(poids);
        // Ici, qty (X) est la quantité en unité mesurée (kg, L, ...)
        // On retire X / poids pièces du stock
        const quantiteRetrait = qty / poidsValue;
        const quantiteMesuree = qty;

        return {
          montant: prixPartiel * quantiteMesuree,
          base: `PARTIAL (${uniteMesure})`,
          prixUtilise: prixPartiel,
          quantiteRetrait
        };
      }

      // Sinon, on se comporte comme une vente partielle classique
      return {
        montant: prixPartiel * qty,
        base: `PARTIAL (${uniteMesure})`,
        prixUtilise: prixPartiel,
        quantiteRetrait: qty
      };
    }

    default:
      throw new Error('Mode de vente inconnu');
  }
};
