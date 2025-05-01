const mongoose = require('mongoose');

const AchievementSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  earnedBadges: {
    type: Number,
    default: 0
  },
  totalPoints: {
    type: Number,
    default: 0
  },
  nextMilestone: {
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    progress: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    },
    reward: {
      type: String,
      required: true
    }
  },
  categories: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    color: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: true
    },
    badges: [{
      id: {
        type: String,
        required: true
      },
      title: {
        type: String,
        required: true
      },
      description: {
        type: String,
        required: true
      },
      icon: {
        type: String,
        required: true
      },
      progress: {
        type: Number,
        default: 0
      },
      unlocked: {
        type: Boolean,
        default: false
      },
      date: {
        type: Date
      }
    }]
  }],
  leaderboard: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    points: {
      type: Number,
      required: true
    },
    rank: {
      type: Number,
      required: true
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
AchievementSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Achievement', AchievementSchema); 