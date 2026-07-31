import { Router } from 'express';
import auth from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import {
  ReplacePortfolioSchema,
  AddItemSchema,
  UpdateItemSchema,
  ImportItemsSchema,
} from '../schemas/portfolioSchemas';
import * as portfolioController from '../controllers/portfolioController';

const router = Router();

router.get('/', auth, portfolioController.getPortfolio);

router.put('/', auth, validateBody(ReplacePortfolioSchema), portfolioController.replacePortfolio);

router.post('/items', auth, validateBody(AddItemSchema), portfolioController.addItem);

router.put('/items/:itemId', auth, validateBody(UpdateItemSchema), portfolioController.updateItem);

router.delete('/items/:itemId', auth, portfolioController.deleteItem);

router.post('/import', auth, validateBody(ImportItemsSchema), portfolioController.importItems);

export default router;
