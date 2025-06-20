const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  balance: {
    type: Number,
    default: 0,
  },
  history: [{
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: true,
    },
    amount: Number,
    reason: String,
    date: {
      type: Date,
      default: Date.now,
    },
  }],
});

module.exports = mongoose.model('Wallet', walletSchema);
