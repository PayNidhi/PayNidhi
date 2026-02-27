// models/Notification.model.js
import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'onModel' },
  onModel: { type: String, required: true, enum: ['Seller', 'Lender', 'Admin'] },
  type: { type: String, required: true, enum: ['alert', 'suggestion', 'success'] }, // Red, Yellow, Green
  title: { type: String, required: true },
  message: { type: String, required: true },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model("Notification", notificationSchema);