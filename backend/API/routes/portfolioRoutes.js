const express = require('express');
const { body } = require('express-validator');

const auth = require('../../middleware/auth');
const portfolioController = require('../controllers/portfolioController');

const router = express.Router();

router.get('/', auth, portfolioController.getPortfolio);

router.put('/', auth, [body('items').isArray().withMessage('items debe ser un array')], portfolioController.replacePortfolio);

router.post(
  '/items',
  auth,
  [body('symbol').isString().withMessage('symbol requerido'), body('amount').isNumeric().withMessage('amount numérico')],
  portfolioController.addItem
);

router.put('/items/:itemId', auth, portfolioController.updateItem);

router.delete('/items/:itemId', auth, portfolioController.deleteItem);

router.post('/import', auth, portfolioController.importItems);

module.exports = router;
