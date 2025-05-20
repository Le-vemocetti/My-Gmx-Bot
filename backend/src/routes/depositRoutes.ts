import express from 'express';
import { handleDeposit } from '../controllers/depositController';

const router = express.Router();

// POST /api/deposit
router.post('/deposit', handleDeposit);

export default router;
