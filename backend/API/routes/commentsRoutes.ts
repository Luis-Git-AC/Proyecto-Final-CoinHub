import { Router } from 'express';
import { body } from 'express-validator';
import auth from '../../middleware/auth';
import * as commentsController from '../controllers/commentsController';

const router = Router();

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
      .withMessage('El comentario debe tener entre 1 y 1000 caracteres'),
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
      .withMessage('El comentario debe tener entre 1 y 1000 caracteres'),
  ],
  commentsController.updateComment
);

router.delete('/:commentId', auth, commentsController.deleteComment);

export default router;
