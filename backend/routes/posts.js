const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const auth = require('../middleware/auth');
const { uploadSingle, handleMulterError } = require('../middleware/upload');
const { uploadToCloudinary, deleteFromCloudinary } = require('../config/cloudinary');

router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 10, category, userId } = req.query;
    
    const filter = {};
    if (category) filter.category = category;
    if (userId) filter.userId = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const posts = await Post.find(filter)
      .populate('userId', 'username avatar email')
      .sort({ createdAt: -1 }) 
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Post.countDocuments(filter);

    res.status(200).json({
      posts,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener posts:', error);
    res.status(500).json({ error: 'Error al obtener posts' });
  }
});

router.get('/:postId', async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id;
    const post = await Post.findById(postId)
      .populate('userId', 'username avatar email role');

    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    res.status(200).json({ post });
  } catch (error) {
    console.error('Error al obtener post:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de post inválido' });
    }
    
    res.status(500).json({ error: 'Error al obtener post' });
  }
});

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
    
    body('content')
      .trim()
      .isLength({ min: 10 })
      .withMessage('El contenido debe tener al menos 10 caracteres'),
    
    body('category')
      .isIn(['análisis', 'tutorial', 'experiencia', 'pregunta'])
      .withMessage('Categoría inválida')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { title, content, category } = req.body;
      let imageUrl = '';

      if (req.file) {
        try {
          const result = await uploadToCloudinary(
            req.file.buffer,
            'cryptohub/posts',
            'image'
          );
          imageUrl = result.secure_url;
        } catch (cloudError) {
          console.error('Error al subir a Cloudinary:', cloudError);
          return res.status(500).json({ 
            error: 'Error al subir la imagen' 
          });
        }
      }

      const newPost = new Post({
        userId: req.userId,
        title,
        content,
        category,
        image: imageUrl
      });

      await newPost.save();

      const populatedPost = await Post.findById(newPost._id)
        .populate('userId', 'username avatar email');

      res.status(201).json({
        message: 'Post creado exitosamente',
        post: populatedPost
      });
    } catch (error) {
      console.error('Error al crear post:', error);
      res.status(500).json({ error: 'Error al crear post' });
    }
  }
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
  async (req, res) => {
    try {
      const postId = req.params.postId || req.params.id;
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const post = await Post.findById(postId);
      
      if (!post) {
        return res.status(404).json({ error: 'Post no encontrado' });
      }

      if (post.userId.toString() !== req.userId.toString() && req.user.role !== 'admin' && req.user.role !== 'owner') {
        return res.status(403).json({ 
          error: 'No tienes permisos para editar este post' 
        });
      }

      const { title, content, category } = req.body;
      if (title) post.title = title;
      if (content) post.content = content;
      if (category) post.category = category;

      if (req.file) {
        if (post.image) {
          try {
            const urlParts = post.image.split('/');
            const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
            console.log('🗑️ Eliminando imagen anterior de Cloudinary:', folderAndFile);
            await deleteFromCloudinary(folderAndFile, 'image');
          } catch (delError) {
            console.error('❌ Error al eliminar imagen anterior:', delError);
          }
        }

        try {
          const result = await uploadToCloudinary(
            req.file.buffer,
            'cryptohub/posts',
            'image'
          );
          post.image = result.secure_url;
        } catch (cloudError) {
          console.error('Error al subir nueva imagen:', cloudError);
          return res.status(500).json({ 
            error: 'Error al subir la nueva imagen' 
          });
        }
      }

      await post.save();

      const updatedPost = await Post.findById(post._id)
        .populate('userId', 'username avatar email');

      res.status(200).json({
        message: 'Post actualizado exitosamente',
        post: updatedPost
      });
    } catch (error) {
      console.error('Error al actualizar post:', error);
      
      if (error.kind === 'ObjectId') {
        return res.status(400).json({ error: 'ID de post inválido' });
      }
      
      res.status(500).json({ error: 'Error al actualizar post' });
    }
  }
);

router.delete('/:postId', auth, async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id;
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    if (post.userId.toString() !== req.userId.toString() && req.user.role !== 'admin' && req.user.role !== 'owner') {
      return res.status(403).json({ 
        error: 'No tienes permisos para eliminar este post' 
      });
    }

    if (post.image) {
      try {
        const urlParts = post.image.split('/');
        const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
        console.log('🗑️ Eliminando de Cloudinary:', folderAndFile);
        await deleteFromCloudinary(folderAndFile, 'image');
      } catch (delError) {
        console.error('❌ Error al eliminar imagen de Cloudinary:', delError);
      }
    }

    await Post.findByIdAndDelete(postId);

    res.status(200).json({ 
      message: 'Post eliminado exitosamente' 
    });
  } catch (error) {
    console.error('Error al eliminar post:', error);
    
      if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de post inválido' });
    }
    
    res.status(500).json({ error: 'Error al eliminar post' });
  }
});

router.post('/:postId/like', auth, async (req, res) => {
  try {
    const postId = req.params.postId || req.params.id;
    const post = await Post.findById(postId);
    
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    const likeIndex = post.likes.indexOf(req.userId);

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else {
      post.likes.push(req.userId);
    }

    await post.save();

    res.status(200).json({
      message: likeIndex > -1 ? 'Like removido' : 'Like agregado',
      likes: post.likes.length,
      hasLiked: likeIndex === -1
    });
  } catch (error) {
    console.error('Error al dar like:', error);
    
    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de post inválido' });
    }
    
    res.status(500).json({ error: 'Error al procesar like' });
  }
});

module.exports = router;
