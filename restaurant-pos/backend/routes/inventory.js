const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getInventory);
router.get('/transactions', authenticate, authorize('ADMIN'), ctrl.getTransactions);
router.post('/purchase', authenticate, authorize('ADMIN'), ctrl.purchaseStock);
router.post('/adjust', authenticate, authorize('ADMIN'), ctrl.adjustStock);

module.exports = router;
