const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');

    if (!authHeader) {
      return res.status(401).json({ 
        error: 'No se proporcionó token de autenticación' 
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Formato de Authorization inválido' });
    }

    const token = authHeader.slice(7).trim();

    if (!token) {
      return res.status(401).json({ 
        error: 'No se proporcionó token de autenticación' 
      });
    }

    const jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
    if (!jwtPattern.test(token)) {
      return res.status(401).json({ error: 'Token inválido' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      console.error('Error en middleware auth:', err.message);
      if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'Token inválido' });
      }
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado' });
      }
      return res.status(401).json({ error: 'Autenticación fallida' });
    }

    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(401).json({ 
        error: 'Usuario no encontrado o token inválido' 
      });
    }

    if (typeof decoded.tokenVersion !== 'undefined' && decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({ error: 'Token inválido o revocado' });
    }

    req.user = user;
    req.userId = user._id;

    next();
  } catch (error) {
    console.error('Error en middleware auth:', error.message);
    res.status(500).json({ error: 'Error interno de autenticación' });
  }
};

module.exports = auth;
