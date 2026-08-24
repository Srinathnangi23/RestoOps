const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/recipeController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getRecipes);
router.post('/', authenticate, authorize('ADMIN'), ctrl.createOrUpdateRecipe);
router.delete('/:menuItemId', authenticate, authorize('ADMIN'), ctrl.deleteRecipe);

module.exports = router;
