const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El userId es obligatorio']
  },
  title: {
    type: String,
    required: [true, 'El título es obligatorio'],
    trim: true,
    minlength: [5, 'El título debe tener al menos 5 caracteres'],
    maxlength: [150, 'El título no puede exceder 150 caracteres']
  },
  description: {
    type: String,
    required: [true, 'La descripción es obligatoria'],
    trim: true,
    minlength: [10, 'La descripción debe tener al menos 10 caracteres'],
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  type: {
    type: String,
    required: [true, 'El tipo es obligatorio'],
    enum: {
      values: ['pdf', 'image', 'guide'],
      message: '{VALUE} no es un tipo válido'
    }
  },
  fileUrl: {
    type: String,
    required: [true, 'La URL del archivo es obligatoria']
  },
  originalName: {
    type: String
  },
  category: {
    type: String,
    required: [true, 'La categoría es obligatoria'],
    enum: {
      values: ['análisis-técnico', 'fundamentos', 'trading', 'seguridad', 'defi', 'otro'],
      message: '{VALUE} no es una categoría válida'
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

resourceSchema.index({ userId: 1 });
resourceSchema.index({ category: 1 });
resourceSchema.index({ type: 1 });
resourceSchema.index({ createdAt: -1 });

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;
