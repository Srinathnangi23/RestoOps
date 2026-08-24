const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/sales', authenticate, authorize('ADMIN'), ctrl.salesReport);
router.get('/profit-loss', authenticate, authorize('ADMIN'), ctrl.profitLossReport);
router.get('/ingredient-usage', authenticate, authorize('ADMIN'), ctrl.ingredientUsageReport);
router.get('/wastage', authenticate, authorize('ADMIN'), ctrl.wastageReport);
router.get('/best-sellers', authenticate, authorize('ADMIN'), ctrl.bestSellersReport);
router.get('/payment-methods', authenticate, authorize('ADMIN'), ctrl.paymentMethodsReport);

module.exports = router;
