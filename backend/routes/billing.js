const express = require('express');
const router = express.Router();
const billingController = require('../controllers/billingController');
const { authenticateToken } = require('../middleware/auth');

router.post('/create', authenticateToken, billingController.createBill);
router.get('/', authenticateToken, billingController.getBills);
router.get('/:id', authenticateToken, billingController.getBillById);

module.exports = router;
