const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/dashboard', authenticateToken, requireRole('admin'), adminController.getDashboard);
router.get('/orders', authenticateToken, requireRole('admin'), adminController.getAllOrders);
router.get('/orders/:id', authenticateToken, requireRole('admin'), adminController.getOrderDetails);
router.get('/sales', authenticateToken, requireRole('admin'), adminController.getSalesReport);

module.exports = router;
