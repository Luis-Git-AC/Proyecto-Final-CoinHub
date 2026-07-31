import { Schema, model } from 'mongoose';
import type { IComment } from '../../types/models';

const commentSchema = new Schema<IComment>(
  {
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
      required: [true, 'El postId es obligatorio'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'El userId es obligatorio'],
    },
    content: {
      type: String,
      required: [true, 'El contenido es obligatorio'],
      trim: true,
      minlength: [1, 'El comentario no puede estar vacío'],
      maxlength: [1000, 'El comentario no puede exceder 1000 caracteres'],
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

commentSchema.index({ postId: 1, createdAt: 1 });
commentSchema.index({ userId: 1 });

const Comment = model<IComment>('Comment', commentSchema);

export default Comment;
