const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        maxlength: 100
    },
    password: {
        type: String,
        required: true,
        maxlength: 255
    },
    role: {
        type: String,
        required: true,
        enum: ['customer', 'admin']
    }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
