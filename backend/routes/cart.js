const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const { authenticateToken } = require('../middleware/auth');

router.post('/', authenticateToken, cartController.addToCart);
router.get('/', authenticateToken, cartController.getCart);
router.put('/', authenticateToken, cartController.updateCartItem);
router.delete('/:item_id', authenticateToken, cartController.removeFromCart);
router.delete('/', authenticateToken, cartController.clearCart);

module.exports = router;
