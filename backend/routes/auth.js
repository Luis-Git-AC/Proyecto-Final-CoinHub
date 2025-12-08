const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');

router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 })
      .withMessage('El username debe tener entre 3 y 30 caracteres')
      .matches(/^[a-zA-Z0-9_]+$/)
      .withMessage('El username solo puede contener letras, números y guiones bajos'),
    
    body('email')
      .trim()
      .isEmail()
      .withMessage('Debe proporcionar un email válido')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
    
    body('wallet_address')
      .optional()
      .trim()
      .matches(/^0x[a-fA-F0-9]{40}$/)
      .withMessage('La dirección de wallet debe tener formato válido (0x + 40 caracteres hex)')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { username, email, password, avatar, wallet_address } = req.body;

      const existingUser = await User.findOne({ 
        $or: [{ email }, { username }] 
      });

      if (existingUser) {
        return res.status(400).json({ 
          error: 'El email o username ya está registrado' 
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newUser = new User({
        username,
        email,
        password: hashedPassword,
        avatar: avatar || `https://ui-avatars.com/api/?name=${username}&background=random`,
        wallet_address: wallet_address || '',
        role: 'user' 
      });

      await newUser.save();

      const token = jwt.sign(
        { userId: newUser._id, role: newUser.role, tokenVersion: newUser.tokenVersion },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(201).json({
        message: 'Usuario registrado exitosamente',
        token,
        user: {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          avatar: newUser.avatar,
          wallet_address: newUser.wallet_address,
          role: newUser.role
        }
      });

    } catch (error) {
      console.error('Error en /register:', error);
      res.status(500).json({ error: 'Error al registrar usuario' });
    }
  }
);

router.post(
  '/login',
  [
    body('email')
      .trim()
      .isEmail()
      .withMessage('Debe proporcionar un email válido')
      .normalizeEmail(),
    
    body('password')
      .notEmpty()
      .withMessage('La contraseña es requerida')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(401).json({ 
          error: 'Credenciales inválidas' 
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({ 
          error: 'Credenciales inválidas' 
        });
      }

      const token = jwt.sign(
        { userId: user._id, role: user.role, tokenVersion: user.tokenVersion },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.status(200).json({
        message: 'Login exitoso',
        token,
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          avatar: user.avatar,
          wallet_address: user.wallet_address,
          role: user.role
        }
      });

    } catch (error) {
      console.error('Error en /login:', error);
      res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  }
);

const auth = require('../middleware/auth');

router.get('/me', auth, async (req, res) => {
  try {
    res.status(200).json({
      user: {
        _id: req.user._id,
        username: req.user.username,
        email: req.user.email,
        avatar: req.user.avatar,
        wallet_address: req.user.wallet_address,
        role: req.user.role
      }
    });
  } catch (error) {
    console.error('Error en /me:', error);
    res.status(500).json({ error: 'Error al obtener datos del usuario' });
  }
});

module.exports = router;
