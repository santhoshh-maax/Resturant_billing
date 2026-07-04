const mongoose = require('mongoose');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');

exports.getDashboard = async (req, res) => {
    try {
        const totalOrders = await Order.countDocuments();
        const totalRevenueResult = await Order.aggregate([
            { $group: { _id: null, total: { $sum: '$total_amount' } } }
        ]);
        const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;
        const totalMenuItems = await MenuItem.countDocuments();

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todaySalesResult = await Order.aggregate([
            { $match: { order_date: { $gte: today } } },
            { $group: { _id: null, total: { $sum: '$total_amount' } } }
        ]);
        const todaySales = todaySalesResult.length > 0 ? todaySalesResult[0].total : 0;

        const recentOrders = await Order.aggregate([
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
            { $sort: { order_date: -1 } },
            { $limit: 5 }
        ]);

        res.json({
            totalOrders,
            totalRevenue,
            totalMenuItems,
            todaySales,
            recentOrders
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const { search } = req.query;
        let matchStage = {};

        if (search) {
            const users = await User.find({ username: { $regex: search, $options: 'i' } }).select('_id');
            const userIds = users.map(u => u._id);
            matchStage = {
                $or: [
                    { _id: mongoose.Types.ObjectId.isValid(search) ? new mongoose.Types.ObjectId(search) : null },
                    { customer_id: { $in: userIds } }
                ]
            };
        }

        const orders = await Order.aggregate([
            ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
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
        console.error('Get orders error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getOrderDetails = async (req, res) => {
    try {
        const { id } = req.params;

        const orderResult = await Order.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
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

        const items = await Order.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } },
            {
                $lookup: {
                    from: 'orderitems',
                    localField: '_id',
                    foreignField: 'order_id',
                    as: 'orderItems'
                }
            },
            { $unwind: '$orderItems' },
            {
                $lookup: {
                    from: 'menuitems',
                    localField: 'orderItems.item_id',
                    foreignField: '_id',
                    as: 'menuItem'
                }
            },
            { $unwind: '$menuItem' },
            {
                $project: {
                    order_item_id: '$orderItems._id',
                    order_id: 1,
                    item_id: '$orderItems.item_id',
                    quantity: '$orderItems.quantity',
                    subtotal: '$orderItems.subtotal',
                    name: '$menuItem.name',
                    category: '$menuItem.category'
                }
            }
        ]);

        res.json({
            order: orderResult[0],
            items
        });
    } catch (err) {
        console.error('Get order details error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getSalesReport = async (req, res) => {
    try {
        const { type, start_date, end_date } = req.query;

        let groupStage;
        let matchStage = {};

        if (type === 'daily') {
            groupStage = {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$order_date' } },
                    order_count: { $sum: 1 },
                    total_sales: { $sum: '$total_amount' }
                }
            };
        } else if (type === 'monthly') {
            groupStage = {
                $group: {
                    _id: {
                        year: { $year: '$order_date' },
                        month: { $month: '$order_date' }
                    },
                    order_count: { $sum: 1 },
                    total_sales: { $sum: '$total_amount' }
                }
            };
        } else if (start_date && end_date) {
            matchStage = {
                order_date: {
                    $gte: new Date(start_date),
                    $lte: new Date(end_date + 'T23:59:59.999Z')
                }
            };
            groupStage = {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$order_date' } },
                    order_count: { $sum: 1 },
                    total_sales: { $sum: '$total_amount' }
                }
            };
        } else {
            return res.status(400).json({
                error: 'Specify type (daily/monthly) or start_date and end_date'
            });
        }

        const report = await Order.aggregate([
            ...(Object.keys(matchStage).length > 0 ? [{ $match: matchStage }] : []),
            groupStage,
            { $sort: { _id: -1 } }
        ]);

        const totalResult = await Order.aggregate([
            { $group: { _id: null, grand_total: { $sum: '$total_amount' } } }
        ]);
        const totalRevenue = totalResult.length > 0 ? totalResult[0].grand_total : 0;

        const formatted = report.map(r => {
            if (type === 'monthly') {
                return {
                    year: r._id.year,
                    month: r._id.month,
                    order_count: r.order_count,
                    total_sales: r.total_sales
                };
            }
            return {
                date: r._id,
                order_count: r.order_count,
                total_sales: r.total_sales
            };
        });

        res.json({
            report: formatted,
            total_revenue: totalRevenue
        });
    } catch (err) {
        console.error('Sales report error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
