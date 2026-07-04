const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        maxlength: 150
    },
    category: {
        type: String,
        required: true,
        enum: ['Starters', 'Main Course', 'Drinks', 'Desserts']
    },
    description: {
        type: String,
        default: ''
    },
    price: {
        type: Number,
        required: true,
        min: 0
    },
    image_url: {
        type: String,
        default: ''
    }
}, {
    timestamps: true,
    toJSON: {
        virtuals: true,
        transform: function (doc, ret) {
            ret.item_id = ret._id;
            delete ret.__v;
            return ret;
        }
    }
});

module.exports = mongoose.model('MenuItem', menuItemSchema);
