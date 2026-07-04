const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
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

        const order = await Order.create({
            customer_id: userId,
            total_amount: totalAmount,
            payment_method: payment_method
        });

        for (const item of cart) {
            await OrderItem.create({
                order_id: order._id,
                item_id: item.item_id,
                quantity: item.quantity,
                subtotal: item.subtotal
            });
        }

        delete getCartStore()[userId];

        res.status(201).json({
            message: 'Order created successfully',
            order_id: order._id,
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
        const orders = await Order.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'customer_id',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            { $unwind: '$customer' },
            {
                $project: {
                    order_id: '$_id',
                    customer_id: 1,
                    total_amount: 1,
                    payment_method: 1,
                    order_date: 1,
                    customer_name: '$customer.username'
                }
            },
            { $sort: { order_date: -1 } }
        ]);
        res.json(orders);
    } catch (err) {
        console.error('Get bills error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getBillById = async (req, res) => {
    try {
        const { id } = req.params;

        const orderResult = await Order.aggregate([
            { $match: { _id: new (require('mongoose').Types.ObjectId)(id) } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'customer_id',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            { $unwind: '$customer' },
            {
                $project: {
                    order_id: '$_id',
                    customer_id: 1,
                    total_amount: 1,
                    payment_method: 1,
                    order_date: 1,
                    customer_name: '$customer.username'
                }
            }
        ]);

        if (orderResult.length === 0) {
            return res.status(404).json({ error: 'Order not found' });
        }

        const itemsResult = await OrderItem.aggregate([
            { $match: { order_id: new (require('mongoose').Types.ObjectId)(id) } },
            {
                $lookup: {
                    from: 'menuitems',
                    localField: 'item_id',
                    foreignField: '_id',
                    as: 'menuItem'
                }
            },
            { $unwind: '$menuItem' },
            {
                $project: {
                    order_item_id: '$_id',
                    order_id: 1,
                    item_id: 1,
                    quantity: 1,
                    subtotal: 1,
                    name: '$menuItem.name',
                    category: '$menuItem.category'
                }
            }
        ]);

        res.json({
            order: orderResult[0],
            items: itemsResult
        });
    } catch (err) {
        console.error('Get bill error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
