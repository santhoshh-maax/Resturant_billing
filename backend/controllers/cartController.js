const { query } = require('../config/db');

const cartStore = {};

exports.addToCart = async (req, res) => {
    try {
        const { item_id, quantity } = req.body;
        const userId = req.user.userId;

        if (!item_id || !quantity) {
            return res.status(400).json({ error: 'Item ID and quantity are required' });
        }

        const itemResult = await query(
            'SELECT * FROM MenuItems WHERE item_id = @param0',
            [item_id]
        );

        if (itemResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Menu item not found' });
        }

        if (!cartStore[userId]) {
            cartStore[userId] = [];
        }

        const existingIndex = cartStore[userId].findIndex(
            item => item.item_id === item_id
        );

        if (existingIndex >= 0) {
            cartStore[userId][existingIndex].quantity += quantity;
            cartStore[userId][existingIndex].subtotal =
                cartStore[userId][existingIndex].quantity * cartStore[userId][existingIndex].price;
        } else {
            const menuItem = itemResult.recordset[0];
            cartStore[userId].push({
                item_id: menuItem.item_id,
                name: menuItem.name,
                category: menuItem.category,
                price: menuItem.price,
                quantity: quantity,
                subtotal: quantity * menuItem.price,
                image_url: menuItem.image_url
            });
        }

        res.json({
            message: 'Item added to cart',
            cart: cartStore[userId]
        });
    } catch (err) {
        console.error('Add to cart error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const cart = cartStore[userId] || [];

        const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
        const gst = subtotal * 0.18;
        const total = subtotal + gst;

        res.json({
            items: cart,
            subtotal: Math.round(subtotal * 100) / 100,
            gst: Math.round(gst * 100) / 100,
            total: Math.round(total * 100) / 100
        });
    } catch (err) {
        console.error('Get cart error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateCartItem = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { item_id, quantity } = req.body;

        if (!cartStore[userId]) {
            return res.status(404).json({ error: 'Cart is empty' });
        }

        const itemIndex = cartStore[userId].findIndex(
            item => item.item_id === item_id
        );

        if (itemIndex === -1) {
            return res.status(404).json({ error: 'Item not found in cart' });
        }

        if (quantity <= 0) {
            cartStore[userId].splice(itemIndex, 1);
        } else {
            cartStore[userId][itemIndex].quantity = quantity;
            cartStore[userId][itemIndex].subtotal =
                quantity * cartStore[userId][itemIndex].price;
        }

        res.json({
            message: 'Cart updated',
            cart: cartStore[userId]
        });
    } catch (err) {
        console.error('Update cart error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.removeFromCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { item_id } = req.params;

        if (!cartStore[userId]) {
            return res.status(404).json({ error: 'Cart is empty' });
        }

        cartStore[userId] = cartStore[userId].filter(
            item => item.item_id !== parseInt(item_id)
        );

        res.json({
            message: 'Item removed from cart',
            cart: cartStore[userId]
        });
    } catch (err) {
        console.error('Remove from cart error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.clearCart = async (req, res) => {
    try {
        const userId = req.user.userId;
        delete cartStore[userId];
        res.json({ message: 'Cart cleared' });
    } catch (err) {
        console.error('Clear cart error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getCartStore = () => cartStore;
