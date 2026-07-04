const { query } = require('../config/db');
const { getCartStore } = require('./cartController');

exports.createBill = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { payment_method } = req.body;

        if (!payment_method) {
            return res.status(400).json({ error: 'Payment method is required' });
        }

        const validMethods = ['Cash', 'Card', 'UPI'];
        if (!validMethods.includes(payment_method)) {
            return res.status(400).json({ error: 'Invalid payment method' });
        }

        const cart = getCartStore()[userId];
        if (!cart || cart.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
        const gst = subtotal * 0.18;
        const totalAmount = Math.round((subtotal + gst) * 100) / 100;

        const orderResult = await query(
            `INSERT INTO Orders (customer_id, total_amount, payment_method)
             VALUES (@param0, @param1, @param2);
             SELECT SCOPE_IDENTITY() as order_id;`,
            [userId, totalAmount, payment_method]
        );

        const orderId = orderResult.recordset[0].order_id;

        for (const item of cart) {
            await query(
                `INSERT INTO OrderItems (order_id, item_id, quantity, subtotal)
                 VALUES (@param0, @param1, @param2, @param3)`,
                [orderId, item.item_id, item.quantity, item.subtotal]
            );
        }

        delete getCartStore()[userId];

        res.status(201).json({
            message: 'Order created successfully',
            order_id: orderId,
            total_amount: totalAmount,
            payment_method: payment_method,
            items: cart,
            subtotal: Math.round(subtotal * 100) / 100,
            gst: Math.round(gst * 100) / 100
        });
    } catch (err) {
        console.error('Create bill error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getBills = async (req, res) => {
    try {
        const result = await query(
            `SELECT o.*, u.username as customer_name
             FROM Orders o
             JOIN Users u ON o.customer_id = u.user_id
             ORDER BY o.order_date DESC`
        );
        res.json(result.recordset);
    } catch (err) {
        console.error('Get bills error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getBillById = async (req, res) => {
    try {
        const { id } = req.params;

        const orderResult = await query(
            `SELECT o.*, u.username as customer_name
             FROM Orders o
             JOIN Users u ON o.customer_id = u.user_id
             WHERE o.order_id = @param0`,
            [id]
        );

        if (orderResult.recordset.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const itemsResult = await query(
            `SELECT oi.*, mi.name, mi.category
             FROM OrderItems oi
             JOIN MenuItems mi ON oi.item_id = mi.item_id
             WHERE oi.order_id = @param0`,
            [id]
        );

        res.json({
            order: orderResult.recordset[0],
            items: itemsResult.recordset
        });
    } catch (err) {
        console.error('Get bill error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
