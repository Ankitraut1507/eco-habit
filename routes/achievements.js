const express = require('express');
const router = express.Router();
const {
  getAchievements,
  updateAchievement
} = require('../controllers/achievements');
const { protect } = require('../middleware/auth');

router.use(protect);

router.route('/')
  .get(getAchievements);

router.route('/:id')
  .put(updateAchievement);

module.exports = router; 