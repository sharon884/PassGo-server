const invoiceSchema = new mongoose.Schema({
  userId : { type : mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    required: true,
  },
  invoiceNumber: {
    type: String,
    required: true,
    unique: true,
  },
  issueDate: {
    type: Date,
    default: Date.now,
  },
  taxAmount: {
    type: Number,
    default: 0,
  },
  totalWithTax: {
    type: Number,
    required: true,
  },
});

module.exports = mongoose.model('Invoice', invoiceSchema);
