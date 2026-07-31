import { Schema, model } from 'mongoose';
import type { HydratedDocument } from 'mongoose';
import type { Portfolio, PortfolioItem } from '../../types/models';

const ItemSchema = new Schema<PortfolioItem>(
  {
    symbol: { type: String, required: true, trim: true, uppercase: true },
    amount: { type: Number, required: true, min: 0, default: 0 },
    avgPrice: { type: Number, required: true, min: 0, default: 0 },
    notes: { type: String },
    metadata: { type: Schema.Types.Mixed },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { _id: true }
);

const PortfolioSchema = new Schema<Portfolio>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  items: { type: [ItemSchema], default: [] },
  updatedAt: { type: Date, default: Date.now },
});

PortfolioSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  if (this.items && this.items.length) {
    this.items.forEach((i) => {
      if (!i.updatedAt) i.updatedAt = new Date();
    });
  }
  next();
});

const PortfolioModel = model<Portfolio>('Portfolio', PortfolioSchema);

/** Documento Mongoose ya instanciado: aquí sí aparecen `.save()`, `.id()`, etc. */
export type PortfolioDocument = HydratedDocument<Portfolio>;
export type PortfolioItemDocument = HydratedDocument<PortfolioItem>;

export default PortfolioModel;
