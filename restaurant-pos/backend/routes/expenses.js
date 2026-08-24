const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/expenseController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('ADMIN'), ctrl.getExpenses);
router.post('/', authenticate, authorize('ADMIN'), ctrl.createExpense);
router.put('/:id', authenticate, authorize('ADMIN'), ctrl.updateExpense);
router.delete('/:id', authenticate, authorize('ADMIN'), ctrl.deleteExpense);

module.exports = router;
