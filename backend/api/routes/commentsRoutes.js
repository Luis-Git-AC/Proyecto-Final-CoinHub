const express = require('express');
const { body } = require('express-validator');

const auth = require('../../middleware/auth');
const commentsController = require('../controllers/commentsController');

const router = express.Router();

router.get('/', commentsController.listComments);

router.get('/:commentId', commentsController.getComment);

router.post(
  '/',
  auth,
  [
    body('postId')
      .notEmpty()
      .withMessage('El ID del post es requerido')
      .isMongoId()
      .withMessage('ID de post inválido'),

    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('El comentario debe tener entre 1 y 1000 caracteres')
  ],
  commentsController.createComment
);

router.put(
  '/:commentId',
  auth,
  [
    body('content')
      .trim()
      .isLength({ min: 1, max: 1000 })
      .withMessage('El comentario debe tener entre 1 y 1000 caracteres')
  ],
  commentsController.updateComment
);

router.delete('/:commentId', auth, commentsController.deleteComment);

module.exports = router;
