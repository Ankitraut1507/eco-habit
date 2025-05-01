const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add an event title'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Please add a description']
  },
  location: {
    type: String,
    required: [true, 'Please add a location']
  },
  maxParticipants: {
    type: Number,
    required: [true, 'Please specify the maximum number of participants']
  },
  currentParticipants: {
    type: Number,
    default: 0
  },
  budget: {
    required: {
      type: Number,
      required: [true, 'Please specify the required budget']
    },
    raised: {
      type: Number,
      default: 0
    }
  },
  date: {
    type: Date,
    required: [true, 'Please specify the event date']
  },
  time: {
    type: String,
    required: [true, 'Please specify the event time']
  },
  type: {
    type: String,
    enum: ['Fundraising', 'Volunteer', 'Awareness', 'Training', 'Other'],
    required: [true, 'Please specify the event type']
  },
  status: {
    type: String,
    enum: ['Scheduled', 'In Progress', 'Completed', 'Cancelled'],
    default: 'Scheduled'
  },
  tags: [{
    type: String,
    trim: true
  }],
  ngo: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  participants: [{
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    joinedAt: {
      type: Date,
      default: Date.now
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
EventSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Event', EventSchema); 