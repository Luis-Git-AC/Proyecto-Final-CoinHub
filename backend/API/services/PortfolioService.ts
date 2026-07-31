import type { Types } from 'mongoose';
import type { PortfolioItem } from '../../types/models';
import type { PortfolioRepository } from '../repositories/PortfolioRepository';
import { AppError } from '../../utils/AppError';

const MAX_ITEMS = 2000;

export class PortfolioLimitExceededError extends AppError {
  constructor() {
    super('Número de items excede el límite permitido', 400);
  }
}

export class PortfolioItemExistsError extends AppError {
  constructor() {
    super('La moneda ya existe en el portfolio', 400);
  }
}

export class PortfolioNotFoundError extends AppError {
  constructor() {
    super('Portfolio no encontrado', 404);
  }
}

export class PortfolioItemNotFoundError extends AppError {
  constructor() {
    super('Item no encontrado', 404);
  }
}

interface ItemInput {
  symbol: string;
  amount?: number;
  avgPrice?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

interface ItemUpdate {
  amount?: number;
  avgPrice?: number;
  notes?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Lógica de negocio del portfolio, sin nada de Express (req/res) ni de Zod:
 * recibe datos ya tipados y valida solo invariantes de negocio (límite de
 * items, símbolo duplicado...). El controlador es la única capa que conoce
 * HTTP; este servicio se podría probar o reutilizar sin levantar un server.
 */
export class PortfolioService {
  constructor(private readonly repository: PortfolioRepository) {}

  async getPortfolio(userId: Types.ObjectId | undefined): Promise<PortfolioItem[]> {
    const portfolio = await this.repository.findByUserIdLean(userId);
    return portfolio?.items ?? [];
  }

  async replacePortfolio(userId: Types.ObjectId | undefined, items: ItemInput[]): Promise<PortfolioItem[]> {
    const deduped = this.dedupeBySymbol(items);
    if (deduped.length > MAX_ITEMS) throw new PortfolioLimitExceededError();

    const normalized = deduped.map((item) => ({
      symbol: item.symbol,
      amount: item.amount ?? 0,
      avgPrice: item.avgPrice ?? 0,
      notes: item.notes,
      metadata: item.metadata,
    }));

    const doc = await this.repository.replaceItems(userId, normalized);
    return doc.items;
  }

  async addItem(userId: Types.ObjectId | undefined, item: ItemInput): Promise<PortfolioItem> {
    const portfolio = await this.repository.findOrCreate(userId);

    const existing = portfolio.items.find((i) => i.symbol === item.symbol);
    if (existing) throw new PortfolioItemExistsError();

    if (portfolio.items.length + 1 > MAX_ITEMS) throw new PortfolioLimitExceededError();

    portfolio.items.push({
      symbol: item.symbol,
      amount: item.amount ?? 0,
      avgPrice: item.avgPrice ?? 0,
      notes: item.notes,
      metadata: item.metadata,
    });

    await this.repository.save(portfolio);

    const saved = portfolio.items.find((i) => i.symbol === item.symbol);
    if (!saved) throw new Error('Invariante rota: el item recién insertado no aparece en la lista');
    return saved;
  }

  async updateItem(
    userId: Types.ObjectId | undefined,
    itemId: string,
    changes: ItemUpdate
  ): Promise<PortfolioItem> {
    const portfolio = await this.repository.findByUserId(userId);
    if (!portfolio) throw new PortfolioNotFoundError();

    const item = portfolio.items.id(itemId);
    if (!item) throw new PortfolioItemNotFoundError();

    if (typeof changes.amount !== 'undefined') item.amount = changes.amount;
    if (typeof changes.avgPrice !== 'undefined') item.avgPrice = changes.avgPrice;
    if (typeof changes.notes !== 'undefined') item.notes = changes.notes;
    if (typeof changes.metadata !== 'undefined') item.metadata = changes.metadata;
    item.updatedAt = new Date();

    await this.repository.save(portfolio);
    return item;
  }

  async deleteItem(userId: Types.ObjectId | undefined, itemId: string): Promise<void> {
    const portfolio = await this.repository.findByUserId(userId);
    if (!portfolio) throw new PortfolioNotFoundError();

    const item = portfolio.items.id(itemId);
    if (!item) throw new PortfolioItemNotFoundError();

    item.deleteOne();
    await this.repository.save(portfolio);
  }

  async importItems(userId: Types.ObjectId | undefined, items: ItemInput[]): Promise<PortfolioItem[]> {
    const portfolio = await this.repository.findOrCreate(userId);

    for (const item of items) {
      const amount = item.amount ?? 0;
      const avgPrice = item.avgPrice ?? 0;
      const existing = portfolio.items.find((i) => i.symbol === item.symbol);

      if (existing) {
        const totalAmount = (existing.amount || 0) + amount;
        if (totalAmount > 0) {
          existing.avgPrice = (existing.avgPrice * (existing.amount || 0) + avgPrice * amount) / totalAmount;
        }
        existing.amount = totalAmount;
        existing.updatedAt = new Date();
      } else {
        portfolio.items.push({
          symbol: item.symbol,
          amount,
          avgPrice,
          notes: item.notes,
          metadata: item.metadata,
        });
      }
    }

    if (portfolio.items.length > MAX_ITEMS) throw new PortfolioLimitExceededError();

    await this.repository.save(portfolio);
    return portfolio.items;
  }

  private dedupeBySymbol(items: ItemInput[]): ItemInput[] {
    const seen = new Set<string>();
    const result: ItemInput[] = [];
    for (const item of items) {
      if (!item.symbol) continue;
      if (seen.has(item.symbol)) continue;
      seen.add(item.symbol);
      result.push(item);
    }
    return result;
  }
}
