import { validationResult } from 'express-validator';
import type { Request, Response } from 'express';
import Comment from '../models/Comment';
import Post from '../models/Post';

export async function listComments(req: Request, res: Response): Promise<void> {
  try {
    const { postId, userId, page = '1', limit = '20' } = req.query as Record<string, string>;

    const filter: Record<string, unknown> = {};
    if (postId) filter['postId'] = postId;
    if (userId) filter['userId'] = userId;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await Comment.find(filter)
      .populate('userId', 'username avatar email')
      .populate('postId', 'title')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Comment.countDocuments(filter);

    res.status(200).json({
      comments,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
}

export async function getComment(req: Request, res: Response): Promise<void> {
  try {
    const commentId = req.params['commentId'] ?? req.params['id'];
    const comment = await Comment.findById(commentId)
      .populate('userId', 'username avatar email')
      .populate('postId', 'title');

    if (!comment) {
      res.status(404).json({ error: 'Comentario no encontrado' });
      return;
    }

    res.status(200).json({ comment });
  } catch (error) {
    const err = error as Error & { kind?: string };
    console.error('Error al obtener comentario:', err);
    if (err.kind === 'ObjectId') {
      res.status(400).json({ error: 'ID de comentario inválido' });
      return;
    }
    res.status(500).json({ error: 'Error al obtener comentario' });
  }
}

export async function createComment(req: Request, res: Response): Promise<void> {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { postId, content } = req.body as { postId: string; content: string };

    const post = await Post.findById(postId);
    if (!post) {
      res.status(404).json({ error: 'Post no encontrado' });
      return;
    }

    const newComment = new Comment({ postId, userId: req.userId, content });
    await newComment.save();

    const populatedComment = await Comment.findById(newComment._id)
      .populate('userId', 'username avatar email')
      .populate('postId', 'title');

    res.status(201).json({ message: 'Comentario creado exitosamente', comment: populatedComment });
  } catch (error) {
    console.error('Error al crear comentario:', error);
    res.status(500).json({ error: 'Error al crear comentario' });
  }
}

export async function updateComment(req: Request, res: Response): Promise<void> {
  try {
    const commentId = req.params['commentId'] ?? req.params['id'];
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
      res.status(404).json({ error: 'Comentario no encontrado' });
      return;
    }

    if (comment.userId.toString() !== req.userId?.toString()) {
      res.status(403).json({ error: 'No tienes permisos para editar este comentario' });
      return;
    }

    comment.content = (req.body as { content: string }).content;
    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate('userId', 'username avatar email')
      .populate('postId', 'title');

    res.status(200).json({ message: 'Comentario actualizado exitosamente', comment: updatedComment });
  } catch (error) {
    const err = error as Error & { kind?: string };
    console.error('Error al actualizar comentario:', err);
    if (err.kind === 'ObjectId') {
      res.status(400).json({ error: 'ID de comentario inválido' });
      return;
    }
    res.status(500).json({ error: 'Error al actualizar comentario' });
  }
}

export async function deleteComment(req: Request, res: Response): Promise<void> {
  try {
    const commentId = req.params['commentId'] ?? req.params['id'];
    const comment = await Comment.findById(commentId);

    if (!comment) {
      res.status(404).json({ error: 'Comentario no encontrado' });
      return;
    }

    if (comment.userId.toString() !== req.userId?.toString() && req.user?.role !== 'admin') {
      res.status(403).json({ error: 'No tienes permisos para eliminar este comentario' });
      return;
    }

    await Comment.findByIdAndDelete(commentId);
    res.status(200).json({ message: 'Comentario eliminado exitosamente' });
  } catch (error) {
    const err = error as Error & { kind?: string };
    console.error('Error al eliminar comentario:', err);
    if (err.kind === 'ObjectId') {
      res.status(400).json({ error: 'ID de comentario inválido' });
      return;
    }
    res.status(500).json({ error: 'Error al eliminar comentario' });
  }
}
