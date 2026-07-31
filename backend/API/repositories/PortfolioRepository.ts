import type { Types } from 'mongoose';
import PortfolioModel, { type PortfolioDocument } from '../models/Portfolio';
import type { PortfolioItem } from '../../types/models';

type PortfolioItemInput = Pick<PortfolioItem, 'symbol' | 'amount' | 'avgPrice'> &
  Partial<Pick<PortfolioItem, 'notes' | 'metadata'>>;

/**
 * Encapsula el acceso a Mongoose para Portfolio. PortfolioService no importa
 * el modelo directamente: si mañana la persistencia cambiara (otra base de
 * datos, otro ORM), solo este archivo se vería afectado.
 */
export class PortfolioRepository {
  findByUserId(userId: Types.ObjectId | undefined): Promise<PortfolioDocument | null> {
    return PortfolioModel.findOne({ userId });
  }

  findByUserIdLean(userId: Types.ObjectId | undefined) {
    return PortfolioModel.findOne({ userId }).lean();
  }

  async findOrCreate(userId: Types.ObjectId | undefined): Promise<PortfolioDocument> {
    const existing = await this.findByUserId(userId);
    if (existing) return existing;
    return new PortfolioModel({ userId, items: [] });
  }

  async replaceItems(userId: Types.ObjectId | undefined, items: PortfolioItemInput[]): Promise<PortfolioDocument> {
    const doc = await PortfolioModel.findOneAndUpdate(
      { userId },
      { $set: { items, updatedAt: new Date() } },
      { upsert: true, new: true }
    );
    // upsert + new siempre devuelven el documento
    return doc as PortfolioDocument;
  }

  save(portfolio: PortfolioDocument): Promise<PortfolioDocument> {
    return portfolio.save();
  }
}

export const portfolioRepository = new PortfolioRepository();
