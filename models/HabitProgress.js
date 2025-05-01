const mongoose = require('mongoose');

const HabitProgressSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  habit: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Habit',
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedChallenges: [{
    challengeId: {
      type: String,
      required: true
    },
    completedAt: {
      type: Date,
      default: Date.now
    }
  }],
  streak: {
    current: {
      type: Number,
      default: 0
    },
    longest: {
      type: Number,
      default: 0
    },
    lastUpdated: {
      type: Date,
      default: Date.now
    }
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Create compound index for user and habit
HabitProgressSchema.index({ user: 1, habit: 1 });

// Create compound index for user and date
HabitProgressSchema.index({ user: 1, date: -1 });

// Method to update streak
HabitProgressSchema.methods.updateStreak = async function() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const lastUpdate = this.streak.lastUpdated;
  lastUpdate.setHours(0, 0, 0, 0);

  const dayDiff = Math.floor((today - lastUpdate) / (1000 * 60 * 60 * 24));

  if (this.isCompleted) {
    if (dayDiff <= 1) {
      // Increment streak if completed today or yesterday
      this.streak.current += 1;
    } else {
      // Reset streak if more than a day has passed
      this.streak.current = 1;
    }

    // Update longest streak if current is higher
    if (this.streak.current > this.streak.longest) {
      this.streak.longest = this.streak.current;
    }
  } else if (dayDiff > 1) {
    // Reset streak if habit was not completed and more than a day has passed
    this.streak.current = 0;
  } else if (dayDiff === 1 && !this.isCompleted) {
    // If it's a new day and the habit is not completed, don't update the streak
    // This ensures the streak doesn't reset until the user has a chance to complete the habit
    console.log('Habit not completed today, streak remains unchanged');
  }

  this.streak.lastUpdated = today;
  await this.save();
};

module.exports = mongoose.model('HabitProgress', HabitProgressSchema); 