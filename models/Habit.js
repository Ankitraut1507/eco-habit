const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a habit name'],
    trim: true
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  category: {
    type: String,
    required: [true, 'Please add a category'],
    enum: ['recycle', 'water', 'energy', 'plants', 'transport', 'custom']
  },
  icon: {
    type: String,
    default: 'leaf' // default icon
  },
  iconType: {
    type: String,
    default: 'font-awesome'
  },
  isCustom: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  activatedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  challenges: [{
    text: String,
    points: Number
  }],
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'monthly'],
    default: 'daily'
  },
  reminderTime: {
    type: Date
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Habit', HabitSchema); 