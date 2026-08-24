const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/menuController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getCategories);
router.post('/', authenticate, authorize('ADMIN'), ctrl.createCategory);
router.put('/:id', authenticate, authorize('ADMIN'), ctrl.updateCategory);
router.delete('/:id', authenticate, authorize('ADMIN'), ctrl.deleteCategory);

module.exports = router;
