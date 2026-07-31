import type { Request, Response, NextFunction } from 'express';
import { PortfolioService } from '../services/PortfolioService';
import { portfolioRepository } from '../repositories/PortfolioRepository';
import type {
  ReplacePortfolioPayload,
  AddItemPayload,
  UpdateItemPayload,
  ImportItemsPayload,
} from '../schemas/portfolioSchemas';

const portfolioService = new PortfolioService(portfolioRepository);

type TypedRequest<Body> = Request<Record<string, string>, unknown, Body>;

export async function getPortfolio(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const items = await portfolioService.getPortfolio(req.userId);
    res.status(200).json({ items });
  } catch (error) {
    next(error);
  }
}

export async function replacePortfolio(
  req: TypedRequest<ReplacePortfolioPayload>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const items = await portfolioService.replacePortfolio(req.userId, req.body.items);
    res.status(200).json({ message: 'Portfolio actualizado', items });
  } catch (error) {
    next(error);
  }
}

export async function addItem(req: TypedRequest<AddItemPayload>, res: Response, next: NextFunction): Promise<void> {
  try {
    const item = await portfolioService.addItem(req.userId, req.body);
    res.status(200).json({ item });
  } catch (error) {
    next(error);
  }
}

export async function updateItem(
  req: TypedRequest<UpdateItemPayload>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const itemId = req.params['itemId'] as string;
    const item = await portfolioService.updateItem(req.userId, itemId, req.body);
    res.status(200).json({ item });
  } catch (error) {
    next(error);
  }
}

export async function deleteItem(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const itemId = req.params['itemId'] as string;
    await portfolioService.deleteItem(req.userId, itemId);
    res.status(200).json({ message: 'Item eliminado' });
  } catch (error) {
    next(error);
  }
}

export async function importItems(
  req: TypedRequest<ImportItemsPayload>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const items = await portfolioService.importItems(req.userId, req.body.items);
    res.status(200).json({ message: 'Importación realizada', items });
  } catch (error) {
    next(error);
  }
}
