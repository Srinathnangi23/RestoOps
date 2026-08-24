const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/orderController');
const { authenticate } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getOrders);
router.get('/:id', authenticate, ctrl.getOrderById);
router.post('/', authenticate, ctrl.createOrder);
router.post('/:id/checkout', authenticate, ctrl.checkoutOrder);

module.exports = router;
