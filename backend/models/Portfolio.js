const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  symbol: { type: String, required: true, trim: true, uppercase: true },
  amount: { type: Number, required: true, min: 0, default: 0 },
  avgPrice: { type: Number, required: true, min: 0, default: 0 },
  notes: { type: String },
  metadata: { type: mongoose.Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { _id: true });

const PortfolioSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  items: { type: [ItemSchema], default: [] },
  updatedAt: { type: Date, default: Date.now }
});

PortfolioSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.items && this.items.length) {
    this.items.forEach(i => i.updatedAt = i.updatedAt || new Date());
  }
  next();
});

module.exports = mongoose.model('Portfolio', PortfolioSchema);
