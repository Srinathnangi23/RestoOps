const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getIngredients);
router.post('/', authenticate, authorize('ADMIN'), ctrl.createIngredient);
router.put('/:id', authenticate, authorize('ADMIN'), ctrl.updateIngredient);
router.delete('/:id', authenticate, authorize('ADMIN'), ctrl.deleteIngredient);

module.exports = router;
