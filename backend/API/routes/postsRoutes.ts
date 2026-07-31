import { Router } from 'express';
import auth from '../../middleware/auth';
import { uploadSingle, handleMulterError } from '../../middleware/upload';
import { validateBody } from '../../middleware/validate';
import { CreatePostSchema, UpdatePostSchema } from '../schemas/postsSchemas';
import * as postsController from '../controllers/postsController';

const router = Router();

router.get('/', postsController.listPosts);

router.get('/:postId', postsController.getPost);

router.post(
  '/',
  auth,
  uploadSingle,
  handleMulterError,
  validateBody(CreatePostSchema),
  postsController.createPost
);

router.put(
  '/:postId',
  auth,
  uploadSingle,
  handleMulterError,
  validateBody(UpdatePostSchema),
  postsController.updatePost
);

router.delete('/:postId', auth, postsController.deletePost);

router.post('/:postId/like', auth, postsController.toggleLike);

export default router;
