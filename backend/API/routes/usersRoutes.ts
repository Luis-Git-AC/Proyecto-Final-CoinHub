import { Router } from 'express';
import { body } from 'express-validator';
import auth from '../../middleware/auth';
import checkRole from '../../middleware/checkRole';
import { uploadSingle, handleMulterError } from '../../middleware/upload';
import * as usersController from '../controllers/usersController';

const router = Router();

router.get('/profile', auth, usersController.getProfile);

router.put(
  '/profile',
  auth,
  uploadSingle,
  handleMulterError,
  [
    body('username')
      .optional()
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('El username debe tener entre 3 y 30 caracteres')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('El username solo puede contener letras, números y guiones bajos'),
    body('email').optional().trim().isEmail().withMessage('Email inválido').normalizeEmail(),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('wallet_address')
      .optional()
      .trim()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('Dirección de wallet inválida'),
  ],
  usersController.updateProfile
);

router.put(
  '/profile/password',
  auth,
  [
    body('currentPassword').exists().withMessage('La contraseña actual es requerida'),
    body('newPassword')
      .isLength({ min: 16 })
      .withMessage('La nueva contraseña debe tener al menos 16 caracteres'),
    body('confirmPassword').exists().withMessage('La confirmación de la nueva contraseña es requerida'),
  ],
  usersController.changePassword
);

router.get('/', auth, checkRole('admin', 'owner'), usersController.listUsers);

router.get('/:userId', usersController.getUser);

router.delete('/profile', auth, usersController.deleteOwnAccount);

router.delete('/:userId', auth, checkRole('admin', 'owner'), usersController.deleteUser);

router.put('/:userId/role', auth, checkRole('admin', 'owner'), usersController.updateUserRole);

export default router;
