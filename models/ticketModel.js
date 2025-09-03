import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'event',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  seatNumber: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'used'],
    default: 'active',
  },
  qrCode: {
    type: String,
    required: true,
  },
  checkInTime: {
    type: Date,
    default: null,
  },
  paymentMethod: {
    type: String,
    default: 'credit_card',
  },
  transactionId: {
    type: String,
    default: '',
  },
}, {
  timestamps: true,
});

// Add indexes for better query performance
ticketSchema.index({ eventId: 1, userId: 1 });
ticketSchema.index({ status: 1 });
ticketSchema.index({ qrCode: 1 });

const ticketModel = mongoose.models.ticket || mongoose.model("ticket", ticketSchema);

export default ticketModel;
