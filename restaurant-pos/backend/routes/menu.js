const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/menuController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, ctrl.getMenuItems);
router.post('/', authenticate, authorize('ADMIN'), ctrl.createMenuItem);
router.put('/:id', authenticate, authorize('ADMIN'), ctrl.updateMenuItem);
router.delete('/:id', authenticate, authorize('ADMIN'), ctrl.deleteMenuItem);

module.exports = router;
