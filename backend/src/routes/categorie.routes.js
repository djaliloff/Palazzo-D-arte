import express from 'express';
import { getAllCategories } from '../controllers/categorie.controller.js';

const router = express.Router();

router.get('/', getAllCategories);

export default router;














