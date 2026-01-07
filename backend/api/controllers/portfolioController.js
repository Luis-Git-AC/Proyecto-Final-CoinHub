const { validationResult } = require('express-validator');

const Portfolio = require('../models/Portfolio');

const normalizeSymbol = (rawSymbol) => (rawSymbol || '').toString().trim().toUpperCase();

async function getPortfolio(req, res) {
  try {
    const portfolioDoc = await Portfolio.findOne({ userId: req.userId }).lean();
    if (!portfolioDoc) return res.status(200).json({ items: [] });
    res.status(200).json({ items: portfolioDoc.items || [] });
  } catch (error) {
    console.error('Error GET /api/portfolio', error);
    res.status(500).json({ error: 'Error al obtener portfolio' });
  }
}

async function replacePortfolio(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { items = [] } = req.body;
    if (items.length > 2000) return res.status(400).json({ error: 'Número de items excede el límite permitido' });

    const normalized = items.map((item) => ({
      symbol: normalizeSymbol(item.symbol),
      amount: Number(item.amount) || 0,
      avgPrice: Number(item.avgPrice) || 0,
      notes: item.notes || undefined,
      metadata: item.metadata || undefined
    }));

    const seen = new Set();
    const deduped = [];
    for (const item of normalized) {
      if (!item.symbol) continue;
      if (seen.has(item.symbol)) continue;
      seen.add(item.symbol);
      deduped.push(item);
    }

    const doc = await Portfolio.findOneAndUpdate(
      { userId: req.userId },
      { $set: { items: deduped, updatedAt: new Date() } },
      { upsert: true, new: true }
    );

    res.status(200).json({ message: 'Portfolio actualizado', items: doc.items });
  } catch (error) {
    console.error('Error PUT /api/portfolio', error);
    res.status(500).json({ error: 'Error al actualizar portfolio' });
  }
}

async function addItem(req, res) {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { symbol, amount = 0, avgPrice = 0, notes, metadata } = req.body;
    const sym = normalizeSymbol(symbol);

    let portfolio = await Portfolio.findOne({ userId: req.userId });
    if (!portfolio) {
      portfolio = new Portfolio({ userId: req.userId, items: [] });
    }

    const existing = portfolio.items.find((i) => i.symbol === sym);
    if (existing) {
      return res.status(400).json({ error: 'La moneda ya existe en el portfolio' });
    }

    portfolio.items.push({
      symbol: sym,
      amount: Number(amount) || 0,
      avgPrice: Number(avgPrice) || 0,
      notes,
      metadata
    });

    if (portfolio.items.length > 2000) return res.status(400).json({ error: 'Número de items excede el límite permitido' });

    await portfolio.save();

    const saved = portfolio.items.find((i) => i.symbol === sym);
    res.status(200).json({ item: saved });
  } catch (error) {
    console.error('Error POST /api/portfolio/items', error);
    res.status(500).json({ error: 'Error al añadir/actualizar item' });
  }
}

async function updateItem(req, res) {
  try {
    const { itemId } = req.params;
    const { amount, avgPrice, notes, metadata } = req.body;

    const portfolio = await Portfolio.findOne({ userId: req.userId });
    if (!portfolio) return res.status(404).json({ error: 'Portfolio no encontrado' });

    const item = portfolio.items.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item no encontrado' });

    if (typeof amount !== 'undefined') item.amount = Number(amount) || 0;
    if (typeof avgPrice !== 'undefined') item.avgPrice = Number(avgPrice) || 0;
    if (typeof notes !== 'undefined') item.notes = notes;
    if (typeof metadata !== 'undefined') item.metadata = metadata;
    item.updatedAt = new Date();

    await portfolio.save();
    res.status(200).json({ item });
  } catch (error) {
    console.error('Error PUT /api/portfolio/items/:itemId', error);
    res.status(500).json({ error: 'Error al actualizar item' });
  }
}

async function deleteItem(req, res) {
  try {
    const { itemId } = req.params;
    const portfolio = await Portfolio.findOne({ userId: req.userId });
    if (!portfolio) return res.status(404).json({ error: 'Portfolio no encontrado' });

    const item = portfolio.items.id(itemId);
    if (!item) return res.status(404).json({ error: 'Item no encontrado' });

    item.remove();
    await portfolio.save();

    res.status(200).json({ message: 'Item eliminado' });
  } catch (error) {
    console.error('Error DELETE /api/portfolio/items/:itemId', error);
    res.status(500).json({ error: 'Error al eliminar item' });
  }
}

async function importItems(req, res) {
  try {
    const { items = [] } = req.body;
    if (!Array.isArray(items)) return res.status(400).json({ error: 'items debe ser array' });

    let portfolio = await Portfolio.findOne({ userId: req.userId });
    if (!portfolio) portfolio = new Portfolio({ userId: req.userId, items: [] });

    for (const item of items) {
      const sym = normalizeSymbol(item.symbol);
      if (!sym) continue;
      const amount = Number(item.amount) || 0;
      const avgPrice = Number(item.avgPrice) || 0;

      const existing = portfolio.items.find((i) => i.symbol === sym);
      if (existing) {
        const totalAmount = (existing.amount || 0) + amount;
        if (totalAmount > 0) {
          existing.avgPrice = ((existing.avgPrice * (existing.amount || 0)) + avgPrice * amount) / totalAmount;
        }
        existing.amount = totalAmount;
        existing.updatedAt = new Date();
      } else {
        portfolio.items.push({ symbol: sym, amount, avgPrice, notes: item.notes, metadata: item.metadata });
      }
    }

    if (portfolio.items.length > 2000) return res.status(400).json({ error: 'Número de items excede el límite permitido' });

    await portfolio.save();
    res.status(200).json({ message: 'Importación realizada', items: portfolio.items });
  } catch (error) {
    console.error('Error POST /api/portfolio/import', error);
    res.status(500).json({ error: 'Error al importar portfolio' });
  }
}

module.exports = {
  getPortfolio,
  replacePortfolio,
  addItem,
  updateItem,
  deleteItem,
  importItems
};
