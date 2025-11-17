import express from 'express';
import { getAllCategories, createCategory, updateCategory } from '../controllers/categorie.controller.js';

const router = express.Router();

router.get('/', getAllCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);

export default router;

























