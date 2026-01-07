const express = require('express');
const { body } = require('express-validator');

const auth = require('../../middleware/auth');
const { uploadSingle, handleMulterError } = require('../../middleware/upload');

const postsController = require('../controllers/postsController');

const router = express.Router();

router.get('/', postsController.listPosts);

router.get('/:postId', postsController.getPost);

router.post(
  '/',
  auth,
  uploadSingle,
  handleMulterError,
  [
    body('title')
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('El título debe tener entre 5 y 200 caracteres'),

    body('content').trim().isLength({ min: 10 }).withMessage('El contenido debe tener al menos 10 caracteres'),

    body('category')
      .isIn(['análisis', 'tutorial', 'experiencia', 'pregunta'])
      .withMessage('Categoría inválida')
  ],
  postsController.createPost
);

router.put(
  '/:postId',
  auth,
  uploadSingle,
  handleMulterError,
  [
    body('title')
      .optional()
      .trim()
      .isLength({ min: 5, max: 200 })
      .withMessage('El título debe tener entre 5 y 200 caracteres'),

    body('content')
      .optional()
      .trim()
      .isLength({ min: 10 })
      .withMessage('El contenido debe tener al menos 10 caracteres'),

    body('category')
      .optional()
      .isIn(['análisis', 'tutorial', 'experiencia', 'pregunta'])
      .withMessage('Categoría inválida')
  ],
  postsController.updatePost
);

router.delete('/:postId', auth, postsController.deletePost);

router.post('/:postId/like', auth, postsController.toggleLike);

module.exports = router;
