import express from 'express';
import { getAllMarques } from '../controllers/marque.controller.js';

const router = express.Router();

router.get('/', getAllMarques);

export default router;




