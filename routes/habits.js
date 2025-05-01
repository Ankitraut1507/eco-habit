const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');

// Import controllers
const {
  getPredefinedHabits,
  getActiveHabits,
  createHabit,
  activateHabit,
  deactivateHabit,
  updateHabitProgress,
  getHabitProgress,
  getHabitStats,
  getUserHabits,
  deleteHabit,
  updateHabit
} = require('../controllers/habits');

// Protect all routes
router.use(protect);

// Habit routes
router.get('/predefined', getPredefinedHabits);
router.get('/active', getActiveHabits);
router.get('/stats', getHabitStats);
router.get('/user', getUserHabits);
router.get('/:id/progress', getHabitProgress);

router.post('/', createHabit);
router.post('/:id/activate', activateHabit);
router.post('/:id/deactivate', deactivateHabit);
router.post('/:id/progress', updateHabitProgress);

router.put('/:id', updateHabit);
router.delete('/:id', deleteHabit);

module.exports = router; 