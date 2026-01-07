const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const Resource = require('../models/Resource');

const { uploadToCloudinary, deleteFromCloudinary } = require('../../config/cloudinary');

async function getProfile(req, res) {
  try {
    const user = await User.findById(req.userId).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
}

async function updateProfile(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    const { username, email, password, wallet_address } = req.body;

    if (username || email) {
      const existingUser = await User.findOne({
        $or: [username ? { username } : null, email ? { email } : null].filter(Boolean),
        _id: { $ne: req.userId }
      });

      if (existingUser) {
        return res.status(400).json({
          error: 'El username o email ya está en uso'
        });
      }
    }

    if (username) user.username = username;
    if (email) user.email = email;
    if (wallet_address !== undefined) user.wallet_address = wallet_address;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    if (req.file) {
      if (user.avatar && user.avatar.includes('cloudinary.com')) {
        try {
          const urlParts = user.avatar.split('/');
          const folderAndFile = urlParts
            .slice(urlParts.indexOf('cryptohub'))
            .join('/')
            .split('.')[0];
          console.log('🗑️ Eliminando avatar anterior:', folderAndFile);
          await deleteFromCloudinary(folderAndFile, 'image');
        } catch (delError) {
          console.error('❌ Error al eliminar avatar anterior:', delError);
        }
      }

      try {
        const result = await uploadToCloudinary(req.file.buffer, 'cryptohub/avatars', 'image');
        user.avatar = result.secure_url;
      } catch (cloudError) {
        console.error('Error al subir avatar:', cloudError);
        return res.status(500).json({
          error: 'Error al subir el avatar'
        });
      }
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select('-password');

    res.status(200).json({
      message: 'Perfil actualizado exitosamente',
      user: updatedUser
    });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
}

async function changePassword(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: 'La nueva contraseña y su confirmación no coinciden' });
    }

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.tokenVersion = (user.tokenVersion || 0) + 1;
    await user.save();

    res.status(200).json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({ error: 'Error al cambiar la contraseña' });
  }
}

async function listUsers(req, res) {
  try {
    const { page = 1, limit = 20, role } = req.query;

    const filter = {};
    if (role) filter.role = role;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const users = await User.find(filter)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await User.countDocuments(filter);

    res.status(200).json({
      users,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
}

async function getUser(req, res) {
  try {
    const userId = req.params.userId || req.params.id;
    const user = await User.findById(userId).select('-password -email');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Error al obtener usuario:', error);

    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    res.status(500).json({ error: 'Error al obtener usuario' });
  }
}

async function deleteOwnAccount(req, res) {
  try {
    const { currentPassword } = req.body || {};
    if (!currentPassword) return res.status(400).json({ error: 'Contraseña actual requerida' });

    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (user.role === 'owner') {
      return res.status(403).json({ error: 'Los owners no pueden eliminar su propia cuenta desde el perfil' });
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

    if (user.avatar && user.avatar.includes('cloudinary.com')) {
      try {
        const urlParts = user.avatar.split('/');
        const folderAndFile = urlParts
          .slice(urlParts.indexOf('cryptohub'))
          .join('/')
          .split('.')[0];
        console.log('🗑️ Eliminando avatar del usuario:', folderAndFile);
        await deleteFromCloudinary(folderAndFile, 'image');
      } catch (delError) {
        console.error('❌ Error al eliminar avatar del usuario:', delError);
      }
    }

    const userPosts = await Post.find({ userId: req.userId });
    for (const post of userPosts) {
      if (post.image && post.image.includes('cloudinary.com')) {
        try {
          const urlParts = post.image.split('/');
          const folderAndFile = urlParts
            .slice(urlParts.indexOf('cryptohub'))
            .join('/')
            .split('.')[0];
          console.log('🗑️ Eliminando imagen de post:', folderAndFile);
          await deleteFromCloudinary(folderAndFile, 'image');
        } catch (delError) {
          console.error('❌ Error al eliminar imagen de post:', delError);
        }
      }
    }
    await Post.deleteMany({ userId: req.userId });

    await Comment.deleteMany({ userId: req.userId });

    const userResources = await Resource.find({ userId: req.userId });
    for (const resource of userResources) {
      if (resource.fileUrl && resource.fileUrl.includes('cloudinary.com')) {
        try {
          const urlParts = resource.fileUrl.split('/');
          const folderAndFile = urlParts
            .slice(urlParts.indexOf('cryptohub'))
            .join('/')
            .split('.')[0];
          const resourceType = resource.type === 'pdf' ? 'raw' : 'image';
          console.log('🗑️ Eliminando recurso:', folderAndFile, `(${resourceType})`);
          await deleteFromCloudinary(folderAndFile, resourceType);
        } catch (delError) {
          console.error('❌ Error al eliminar recurso:', delError);
        }
      }
    }
    await Resource.deleteMany({ userId: req.userId });

    await User.findByIdAndDelete(req.userId);

    res.status(200).json({ message: 'Usuario y su contenido eliminado correctamente' });
  } catch (error) {
    console.error('Error al auto-eliminar usuario:', error);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
}

async function deleteUser(req, res) {
  try {
    const userId = req.params.userId || req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    if (user._id.toString() === req.userId.toString()) {
      return res.status(400).json({
        error: 'No puedes eliminar tu propio usuario'
      });
    }

    const requesterRole = req.user && req.user.role;

    if (user.role === 'owner') {
      return res.status(403).json({ error: 'No puedes eliminar a otro owner' });
    }

    if (user.role === 'admin' && requesterRole !== 'owner') {
      return res.status(403).json({ error: 'Solo el owner puede eliminar a un administrador' });
    }

    if (user.avatar && user.avatar.includes('cloudinary.com')) {
      try {
        const urlParts = user.avatar.split('/');
        const folderAndFile = urlParts
          .slice(urlParts.indexOf('cryptohub'))
          .join('/')
          .split('.')[0];
        console.log('🗑️ Eliminando avatar del usuario:', folderAndFile);
        await deleteFromCloudinary(folderAndFile, 'image');
      } catch (delError) {
        console.error('❌ Error al eliminar avatar:', delError);
      }
    }

    const userPosts = await Post.find({ userId });
    for (const post of userPosts) {
      if (post.image && post.image.includes('cloudinary.com')) {
        try {
          const urlParts = post.image.split('/');
          const folderAndFile = urlParts
            .slice(urlParts.indexOf('cryptohub'))
            .join('/')
            .split('.')[0];
          console.log('🗑️ Eliminando imagen de post:', folderAndFile);
          await deleteFromCloudinary(folderAndFile, 'image');
        } catch (delError) {
          console.error('❌ Error al eliminar imagen de post:', delError);
        }
      }
    }
    await Post.deleteMany({ userId });

    await Comment.deleteMany({ userId });

    const userResources = await Resource.find({ userId });
    for (const resource of userResources) {
      if (resource.fileUrl && resource.fileUrl.includes('cloudinary.com')) {
        try {
          const urlParts = resource.fileUrl.split('/');
          const folderAndFile = urlParts
            .slice(urlParts.indexOf('cryptohub'))
            .join('/')
            .split('.')[0];
          const resourceType = resource.type === 'pdf' ? 'raw' : 'image';
          console.log('🗑️ Eliminando recurso:', folderAndFile, `(${resourceType})`);
          await deleteFromCloudinary(folderAndFile, resourceType);
        } catch (delError) {
          console.error('❌ Error al eliminar recurso:', delError);
        }
      }
    }
    await Resource.deleteMany({ userId });

    await User.findByIdAndDelete(userId);

    res.status(200).json({
      message: 'Usuario y todo su contenido eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);

    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de usuario inválido' });
    }

    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
}

async function updateUserRole(req, res) {
  try {
    const { role } = req.body || {};
    const allowed = ['user', 'admin'];
    if (!role || !allowed.includes(role)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    const userId = req.params.userId || req.params.id;
    if (userId === req.userId.toString()) {
      return res.status(400).json({ error: 'No puedes cambiar el rol de tu propia cuenta' });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });

    if (user.role === 'owner') {
      return res.status(403).json({
        error:
          'No está permitido cambiar el rol de un owner desde la administración. Use el script de mantenimiento o contacte al administrador del sistema.'
      });
    }

    const requesterRole = req.user && req.user.role;
    if (user.role === 'admin' && role === 'user' && requesterRole !== 'owner') {
      return res.status(403).json({ error: 'Solo el owner puede despromocionar a un administrador' });
    }

    user.role = role;
    await user.save();

    const safe = await User.findById(user._id).select('-password');
    res.status(200).json({ message: 'Rol actualizado', user: safe });
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    res.status(500).json({ error: 'Error al cambiar rol' });
  }
}

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  listUsers,
  getUser,
  deleteOwnAccount,
  deleteUser,
  updateUserRole
};
