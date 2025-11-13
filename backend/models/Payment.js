import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  mobileNumber: {
    type: String,
    required: true,
    trim: true
  },
  transactionId: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true
  },
  planName: {
    type: String,
    required: true
  },
  credits: {
    type: Number,
    required: true
  },
  reference: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false // Make optional if user system not implemented yet
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  }
}, {
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Index for faster queries
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ mobileNumber: 1 });

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;