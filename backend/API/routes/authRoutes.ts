import { Router } from 'express';
import auth from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { RegisterSchema, LoginSchema } from '../schemas/authSchemas';
import * as authController from '../controllers/authController';

const router = Router();

router.post('/register', validateBody(RegisterSchema), authController.register);

router.post('/login', validateBody(LoginSchema), authController.login);

router.post('/refresh', authController.refresh);

router.post('/logout', authController.logout);

router.get('/me', auth, authController.me);

export default router;
