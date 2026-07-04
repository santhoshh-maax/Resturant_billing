const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');
const { authenticateToken, requireRole } = require('../middleware/auth');

router.get('/', menuController.getAllItems);
router.get('/:id', menuController.getItemById);
router.post('/', authenticateToken, requireRole('admin'), menuController.createItem);
router.put('/:id', authenticateToken, requireRole('admin'), menuController.updateItem);
router.delete('/:id', authenticateToken, requireRole('admin'), menuController.deleteItem);

module.exports = router;
