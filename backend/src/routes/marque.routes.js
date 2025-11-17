import express from 'express';
import {
  getAllMarques,
  createMarque,
  updateMarque,
  addMarqueCredit,
  addMarqueVersment
} from '../controllers/marque.controller.js';

const router = express.Router();

router.get('/', getAllMarques);
router.post('/', createMarque);
router.put('/:id', updateMarque);
router.put('/:id/credit', addMarqueCredit);
router.put('/:id/versment', addMarqueVersment);

export default router;

























