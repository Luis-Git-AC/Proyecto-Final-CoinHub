const express = require('express');
const { body } = require('express-validator');

const auth = require('../../middleware/auth');
const { uploadFile, handleMulterError } = require('../../middleware/upload');

const resourcesController = require('../controllers/resourcesController');

const router = express.Router();

router.get('/', resourcesController.listResources);

router.get('/:resourceId/download', resourcesController.downloadResource);
router.get('/:resourceId/open', resourcesController.openResource);

router.get('/:resourceId', resourcesController.getResource);

router.post(
  '/',
  auth,
  uploadFile,
  handleMulterError,
  [
    body('title')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('El título debe tener entre 5 y 200 caracteres'),

    body('description')
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),

    body('type')
      .isIn(['pdf', 'image', 'guide'])
      .withMessage('Tipo inválido. Debe ser: pdf, image o guide'),

    body('category')
      .isIn(['análisis-técnico', 'fundamentos', 'trading', 'seguridad', 'defi', 'otro'])
      .withMessage('Categoría inválida')
  ],
  resourcesController.createResource
);

router.put(
  '/:resourceId',
  auth,
  uploadFile,
  handleMulterError,
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('El título debe tener entre 5 y 200 caracteres'),

    body('description')
      .optional()
      .trim()
      .isLength({ min: 10, max: 2000 })
      .withMessage('La descripción debe tener entre 10 y 2000 caracteres'),

    body('type').optional().isIn(['pdf', 'image', 'guide']).withMessage('Tipo inválido'),

    body('category')
      .optional()
      .isIn(['análisis-técnico', 'fundamentos', 'trading', 'seguridad', 'defi', 'otro'])
      .withMessage('Categoría inválida')
  ],
  resourcesController.updateResource
);

router.delete('/:resourceId', auth, resourcesController.deleteResource);

module.exports = router;
