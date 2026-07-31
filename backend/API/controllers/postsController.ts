import type { Request, Response } from 'express';
import Post from '../models/Post';
import { uploadToCloudinary, deleteFromCloudinary } from '../../config/cloudinary';
import type { CreatePostPayload, UpdatePostPayload } from '../schemas/postsSchemas';

type TypedRequest<Body> = Request<Record<string, string>, unknown, Body>;

export async function listPosts(req: Request, res: Response): Promise<void> {
  try {
    const { page = '1', limit = '10', category, userId } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};
    if (category) filter['category'] = category;
    if (userId) filter['userId'] = userId;

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
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener posts:', error);
    res.status(500).json({ error: 'Error al obtener posts' });
  }
}

export async function getPost(req: Request, res: Response): Promise<void> {
  try {
    const postId = req.params['postId'] ?? req.params['id'];
    const post = await Post.findById(postId).populate('userId', 'username avatar email role');

    if (!post) {
      res.status(404).json({ error: 'Post no encontrado' });
      return;
    }

    res.status(200).json({ post });
  } catch (error) {
    const err = error as Error & { kind?: string };
    console.error('Error al obtener post:', err);
    if (err.kind === 'ObjectId') {
      res.status(400).json({ error: 'ID de post inválido' });
      return;
    }
    res.status(500).json({ error: 'Error al obtener post' });
  }
}

export async function createPost(req: TypedRequest<CreatePostPayload>, res: Response): Promise<void> {
  try {
    const { title, content, category } = req.body;
    let imageUrl = '';

    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, 'cryptohub/posts', 'image');
        imageUrl = result.secure_url;
      } catch (cloudError) {
        console.error('Error al subir a Cloudinary:', cloudError);
        res.status(500).json({ error: 'Error al subir la imagen' });
        return;
      }
    }

    const newPost = new Post({ userId: req.userId, title, content, category, image: imageUrl });
    await newPost.save();

    const populatedPost = await Post.findById(newPost._id).populate('userId', 'username avatar email');

    res.status(201).json({ message: 'Post creado exitosamente', post: populatedPost });
  } catch (error) {
    console.error('Error al crear post:', error);
    res.status(500).json({ error: 'Error al crear post' });
  }
}

export async function updatePost(req: TypedRequest<UpdatePostPayload>, res: Response): Promise<void> {
  try {
    const postId = req.params['postId'] ?? req.params['id'];

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ error: 'Post no encontrado' });
      return;
    }

    if (
      post.userId.toString() !== req.userId?.toString() &&
      req.user?.role !== 'admin' &&
      req.user?.role !== 'owner'
    ) {
      res.status(403).json({ error: 'No tienes permisos para editar este post' });
      return;
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
          await deleteFromCloudinary(folderAndFile, 'image');
        } catch (delError) {
          console.error('❌ Error al eliminar imagen anterior:', delError);
        }
      }
      try {
        const result = await uploadToCloudinary(req.file.buffer, 'cryptohub/posts', 'image');
        post.image = result.secure_url;
      } catch (cloudError) {
        console.error('Error al subir nueva imagen:', cloudError);
        res.status(500).json({ error: 'Error al subir la nueva imagen' });
        return;
      }
    }

    await post.save();
    const updatedPost = await Post.findById(post._id).populate('userId', 'username avatar email');
    res.status(200).json({ message: 'Post actualizado exitosamente', post: updatedPost });
  } catch (error) {
    const err = error as Error & { kind?: string };
    console.error('Error al actualizar post:', err);
    if (err.kind === 'ObjectId') {
      res.status(400).json({ error: 'ID de post inválido' });
      return;
    }
    res.status(500).json({ error: 'Error al actualizar post' });
  }
}

export async function deletePost(req: Request, res: Response): Promise<void> {
  try {
    const postId = req.params['postId'] ?? req.params['id'];
    const post = await Post.findById(postId);

    if (!post) {
      res.status(404).json({ error: 'Post no encontrado' });
      return;
    }

    if (
      post.userId.toString() !== req.userId?.toString() &&
      req.user?.role !== 'admin' &&
      req.user?.role !== 'owner'
    ) {
      res.status(403).json({ error: 'No tienes permisos para eliminar este post' });
      return;
    }

    if (post.image) {
      try {
        const urlParts = post.image.split('/');
        const folderAndFile = urlParts.slice(urlParts.indexOf('cryptohub')).join('/').split('.')[0];
        await deleteFromCloudinary(folderAndFile, 'image');
      } catch (delError) {
        console.error('❌ Error al eliminar imagen de Cloudinary:', delError);
      }
    }

    await Post.findByIdAndDelete(postId);
    res.status(200).json({ message: 'Post eliminado exitosamente' });
  } catch (error) {
    const err = error as Error & { kind?: string };
    console.error('Error al eliminar post:', err);
    if (err.kind === 'ObjectId') {
      res.status(400).json({ error: 'ID de post inválido' });
      return;
    }
    res.status(500).json({ error: 'Error al eliminar post' });
  }
}

export async function toggleLike(req: Request, res: Response): Promise<void> {
  try {
    const postId = req.params['postId'] ?? req.params['id'];
    const post = await Post.findById(postId);

    if (!post) {
      res.status(404).json({ error: 'Post no encontrado' });
      return;
    }

    const userIdStr = req.userId?.toString() ?? '';
    const likeIndex = post.likes.findIndex((id) => id.toString() === userIdStr);

    if (likeIndex > -1) {
      post.likes.splice(likeIndex, 1);
    } else if (req.userId) {
      post.likes.push(req.userId);
    }

    await post.save();

    res.status(200).json({
      message: likeIndex > -1 ? 'Like removido' : 'Like agregado',
      likes: post.likes.length,
      hasLiked: likeIndex === -1,
    });
  } catch (error) {
    const err = error as Error & { kind?: string };
    console.error('Error al dar like:', err);
    if (err.kind === 'ObjectId') {
      res.status(400).json({ error: 'ID de post inválido' });
      return;
    }
    res.status(500).json({ error: 'Error al procesar like' });
  }
}
