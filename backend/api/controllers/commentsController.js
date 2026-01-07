const { validationResult } = require('express-validator');

const Comment = require('../models/Comment');
const Post = require('../models/Post');

async function listComments(req, res) {
  try {
    const { postId, userId, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (postId) filter.postId = postId;
    if (userId) filter.userId = userId;

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
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error al obtener comentarios:', error);
    res.status(500).json({ error: 'Error al obtener comentarios' });
  }
}

async function getComment(req, res) {
  try {
    const commentId = req.params.commentId || req.params.id;
    const comment = await Comment.findById(commentId)
      .populate('userId', 'username avatar email')
      .populate('postId', 'title');

    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    res.status(200).json({ comment });
  } catch (error) {
    console.error('Error al obtener comentario:', error);

    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de comentario inválido' });
    }

    res.status(500).json({ error: 'Error al obtener comentario' });
  }
}

async function createComment(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { postId, content } = req.body;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post no encontrado' });
    }

    const newComment = new Comment({
      postId,
      userId: req.userId,
      content
    });

    await newComment.save();

    const populatedComment = await Comment.findById(newComment._id)
      .populate('userId', 'username avatar email')
      .populate('postId', 'title');

    res.status(201).json({
      message: 'Comentario creado exitosamente',
      comment: populatedComment
    });
  } catch (error) {
    console.error('Error al crear comentario:', error);
    res.status(500).json({ error: 'Error al crear comentario' });
  }
}

async function updateComment(req, res) {
  try {
    const commentId = req.params.commentId || req.params.id;
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    if (comment.userId.toString() !== req.userId.toString()) {
      return res.status(403).json({ error: 'No tienes permisos para editar este comentario' });
    }

    comment.content = req.body.content;
    await comment.save();

    const updatedComment = await Comment.findById(comment._id)
      .populate('userId', 'username avatar email')
      .populate('postId', 'title');

    res.status(200).json({
      message: 'Comentario actualizado exitosamente',
      comment: updatedComment
    });
  } catch (error) {
    console.error('Error al actualizar comentario:', error);

    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de comentario inválido' });
    }

    res.status(500).json({ error: 'Error al actualizar comentario' });
  }
}

async function deleteComment(req, res) {
  try {
    const commentId = req.params.commentId || req.params.id;
    const comment = await Comment.findById(commentId);

    if (!comment) {
      return res.status(404).json({ error: 'Comentario no encontrado' });
    }

    if (comment.userId.toString() !== req.userId.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este comentario' });
    }

    await Comment.findByIdAndDelete(commentId);

    res.status(200).json({ message: 'Comentario eliminado exitosamente' });
  } catch (error) {
    console.error('Error al eliminar comentario:', error);

    if (error.kind === 'ObjectId') {
      return res.status(400).json({ error: 'ID de comentario inválido' });
    }

    res.status(500).json({ error: 'Error al eliminar comentario' });
  }
}

module.exports = {
  listComments,
  getComment,
  createComment,
  updateComment,
  deleteComment
};
