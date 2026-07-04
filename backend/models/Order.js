const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    total_amount: {
        type: Number,
        required: true,
        default: 0
    },
    payment_method: {
        type: String,
        required: true,
        enum: ['Cash', 'Card', 'UPI']
    },
    order_date: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
