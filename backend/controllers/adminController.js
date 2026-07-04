const { query } = require('../config/db');

exports.getDashboard = async (req, res) => {
    try {
        const totalOrdersResult = await query('SELECT COUNT(*) as count FROM Orders');
        const totalOrders = totalOrdersResult.recordset[0].count;

        const revenueResult = await query(
            'SELECT ISNULL(SUM(total_amount), 0) as total FROM Orders'
        );
        const totalRevenue = revenueResult.recordset[0].total;

        const menuItemsResult = await query('SELECT COUNT(*) as count FROM MenuItems');
        const totalMenuItems = menuItemsResult.recordset[0].count;

        const todaySalesResult = await query(
            `SELECT ISNULL(SUM(total_amount), 0) as total
             FROM Orders
             WHERE CAST(order_date AS DATE) = CAST(GETDATE() AS DATE)`
        );
        const todaySales = todaySalesResult.recordset[0].total;

        const recentOrders = await query(
            `SELECT TOP 5 o.*, u.username as customer_name
             FROM Orders o
             JOIN Users u ON o.customer_id = u.user_id
             ORDER BY o.order_date DESC`
        );

        res.json({
            totalOrders,
            totalRevenue,
            totalMenuItems,
            todaySales,
            recentOrders: recentOrders.recordset
        });
    } catch (err) {
        console.error('Dashboard error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getAllOrders = async (req, res) => {
    try {
        const { search } = req.query;
        let queryStr = `
            SELECT o.*, u.username as customer_name
            FROM Orders o
            JOIN Users u ON o.customer_id = u.user_id
        `;
        const params = [];

        if (search) {
            queryStr += ' WHERE o.order_id LIKE @param0 OR u.username LIKE @param0';
            params.push(`%${search}%`);
        }

        queryStr += ' ORDER BY o.order_date DESC';

        const result = await query(queryStr, params);
        res.json(result.recordset);
    } catch (err) {
        console.error('Get orders error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getOrderDetails = async (req, res) => {
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
        console.error('Get order details error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.getSalesReport = async (req, res) => {
    try {
        const { type, start_date, end_date } = req.query;

        let queryStr = '';
        const params = [];

        if (type === 'daily') {
            queryStr = `
                SELECT CAST(order_date AS DATE) as date,
                       COUNT(*) as order_count,
                       ISNULL(SUM(total_amount), 0) as total_sales
                FROM Orders
                GROUP BY CAST(order_date AS DATE)
                ORDER BY date DESC
            `;
        } else if (type === 'monthly') {
            queryStr = `
                SELECT YEAR(order_date) as year,
                       MONTH(order_date) as month,
                       COUNT(*) as order_count,
                       ISNULL(SUM(total_amount), 0) as total_sales
                FROM Orders
                GROUP BY YEAR(order_date), MONTH(order_date)
                ORDER BY year DESC, month DESC
            `;
        } else if (start_date && end_date) {
            queryStr = `
                SELECT CAST(order_date AS DATE) as date,
                       COUNT(*) as order_count,
                       ISNULL(SUM(total_amount), 0) as total_sales
                FROM Orders
                WHERE CAST(order_date AS DATE) >= @param0
                  AND CAST(order_date AS DATE) <= @param1
                GROUP BY CAST(order_date AS DATE)
                ORDER BY date DESC
            `;
            params.push(start_date, end_date);
        } else {
            return res.status(400).json({
                error: 'Specify type (daily/monthly) or start_date and end_date'
            });
        }

        const result = await query(queryStr, params);

        const totalResult = await query('SELECT ISNULL(SUM(total_amount), 0) as grand_total FROM Orders');
        const totalRevenue = totalResult.recordset[0].grand_total;

        res.json({
            report: result.recordset,
            total_revenue: totalRevenue
        });
    } catch (err) {
        console.error('Sales report error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
};
