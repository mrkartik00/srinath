const mongoose = require('mongoose');
const analyticsDb = require('../../config/analyticsDb');

const systemLogSchema = new mongoose.Schema({
  actorId: { type: mongoose.Schema.Types.ObjectId, required: true },
  actorName: { type: String, default: '' },
  action: { type: String, required: true },
  target: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} },
  timestamp: { type: Date, default: Date.now },
});

systemLogSchema.index({ timestamp: -1 });
systemLogSchema.index({ actorId: 1 });

module.exports = analyticsDb.model('SystemLog', systemLogSchema);
