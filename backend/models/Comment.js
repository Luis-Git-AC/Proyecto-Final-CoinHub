const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Post',
    required: [true, 'El postId es obligatorio']
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El userId es obligatorio']
  },
  content: {
    type: String,
    required: [true, 'El contenido es obligatorio'],
    trim: true,
    minlength: [1, 'El comentario no puede estar vacío'],
    maxlength: [1000, 'El comentario no puede exceder 1000 caracteres']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

commentSchema.index({ postId: 1, createdAt: 1 });
commentSchema.index({ userId: 1 });

const Comment = mongoose.model('Comment', commentSchema);

module.exports = Comment;
