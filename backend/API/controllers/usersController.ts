import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import type { Request, Response } from 'express';
import User from '../models/User';
import Post from '../models/Post';
import Comment from '../models/Comment';
import Resource from '../models/Resource';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary';
import type { UserRole } from '../../types/models';

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({ error: 'Error al obtener perfil' });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const { username, email, password, wallet_address } = req.body as {
      username?: string;
      email?: string;
      password?: string;
      wallet_address?: string;
    };

    if (username || email) {
      const conditions: Record<string, unknown>[] = [];
      if (username) conditions.push({ username });
      if (email) conditions.push({ email });
      const existingUser = await User.findOne({
        $or: conditions,
        _id: { $ne: req.userId },
      });
      if (existingUser) {
        res.status(400).json({ error: 'El username o email ya está en uso' });
        return;
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
          const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
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
        res.status(500).json({ error: 'Error al subir el avatar' });
        return;
      }
    }

    await user.save();
    const updatedUser = await User.findById(user._id).select('-password');
    res.status(200).json({ message: 'Perfil actualizado exitosamente', user: updatedUser });
  } catch (error) {
    console.error('Error al actualizar perfil:', error);
    res.status(500).json({ error: 'Error al actualizar perfil' });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { currentPassword, newPassword, confirmPassword } = req.body as {
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    };

    if (newPassword !== confirmPassword) {
      res.status(400).json({ error: 'La nueva contraseña y su confirmación no coinciden' });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      res.status(401).json({ error: 'Contraseña actual incorrecta' });
      return;
    }

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

export async function listUsers(req: Request, res: Response): Promise<void> {
  try {
    const { page = '1', limit = '20', role } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};
    if (role) filter['role'] = role;

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
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error al listar usuarios:', error);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
}

export async function getUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params['userId'] ?? req.params['id'];
    const user = await User.findById(userId).select('-password -email');

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    const err = error as Error & { kind?: string };
    console.error('Error al obtener usuario:', err);
    if (err.kind === 'ObjectId') {
      res.status(400).json({ error: 'ID de usuario inválido' });
      return;
    }
    res.status(500).json({ error: 'Error al obtener usuario' });
  }
}

export async function deleteOwnAccount(req: Request, res: Response): Promise<void> {
  try {
    const { currentPassword } = (req.body as { currentPassword?: string }) || {};
    if (!currentPassword) {
      res.status(400).json({ error: 'Contraseña actual requerida' });
      return;
    }

    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    if (user.role === 'owner') {
      res.status(403).json({ error: 'Los owners no pueden eliminar su propia cuenta desde el perfil' });
      return;
    }

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      res.status(401).json({ error: 'Contraseña incorrecta' });
      return;
    }

    if (user.avatar && user.avatar.includes('cloudinary.com')) {
      try {
        const urlParts = user.avatar.split('/');
        const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
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
          const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
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
          const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
          const resourceType = resource.type === 'pdf' ? 'raw' : 'image';
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

export async function deleteUser(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.params['userId'] ?? req.params['id'];
    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    if (user._id.toString() === req.userId?.toString()) {
      res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
      return;
    }

    const requesterRole = req.user?.role;

    if (user.role === 'owner') {
      res.status(403).json({ error: 'No puedes eliminar a otro owner' });
      return;
    }
    if (user.role === 'admin' && requesterRole !== 'owner') {
      res.status(403).json({ error: 'Solo el owner puede eliminar a un administrador' });
      return;
    }

    if (user.avatar && user.avatar.includes('cloudinary.com')) {
      try {
        const urlParts = user.avatar.split('/');
        const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
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
          const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
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
          const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
          const resourceType = resource.type === 'pdf' ? 'raw' : 'image';
          await deleteFromCloudinary(folderAndFile, resourceType);
        } catch (delError) {
          console.error('❌ Error al eliminar recurso:', delError);
        }
      }
    }
    await Resource.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: 'Usuario y todo su contenido eliminado exitosamente' });
  } catch (error) {
    const err = error as Error & { kind?: string };
    console.error('Error al eliminar usuario:', err);
    if (err.kind === 'ObjectId') {
      res.status(400).json({ error: 'ID de usuario inválido' });
      return;
    }
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
}

export async function updateUserRole(req: Request, res: Response): Promise<void> {
  try {
    const { role } = (req.body as { role?: string }) || {};
    const allowed: UserRole[] = ['user', 'admin'];
    if (!role || !allowed.includes(role as UserRole)) {
      res.status(400).json({ error: 'Rol inválido' });
      return;
    }

    const userId = req.params['userId'] ?? req.params['id'];
    if (userId === req.userId?.toString()) {
      res.status(400).json({ error: 'No puedes cambiar el rol de tu propia cuenta' });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    if (user.role === 'owner') {
      res.status(403).json({
        error: 'No está permitido cambiar el rol de un owner desde la administración.',
      });
      return;
    }

    const requesterRole = req.user?.role;
    if (user.role === 'admin' && role === 'user' && requesterRole !== 'owner') {
      res.status(403).json({ error: 'Solo el owner puede despromocionar a un administrador' });
      return;
    }

    user.role = role as UserRole;
    await user.save();

    const safe = await User.findById(user._id).select('-password');
    res.status(200).json({ message: 'Rol actualizado', user: safe });
  } catch (error) {
    console.error('Error al cambiar rol:', error);
    res.status(500).json({ error: 'Error al cambiar rol' });
  }
}
